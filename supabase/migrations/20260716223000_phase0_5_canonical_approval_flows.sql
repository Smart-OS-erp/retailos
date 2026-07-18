-- Phase 0.5 canonical write approval flows for normalized non-inventory records.
-- These functions are explicit approval gates. Connectors still write only raw
-- external_records first; normalization still creates review evidence before
-- any canonical product, location, or sales facts are mutated.

create table public.external_record_approval_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  upload_id uuid not null,
  record_type text not null check (
    record_type in ('product_master', 'store_master', 'sales_history')
  ),
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  source_row_count integer not null check (source_row_count between 1 and 10000),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  status text not null default 'completed' check (status = 'completed'),
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, upload_id, record_type),
  foreign key (organization_id, upload_id)
    references public.data_uploads(organization_id, id) on delete restrict
);

alter table public.external_record_approval_runs enable row level security;
alter table public.external_record_approval_runs force row level security;

create policy external_record_approval_runs_select
on public.external_record_approval_runs
for select
using (private.has_permission(organization_id, 'data.view'));

revoke all on table public.external_record_approval_runs from anon, authenticated;
grant select on table public.external_record_approval_runs to authenticated;

create or replace function private.assert_external_upload_approvable(
  target_upload_id uuid,
  expected_content_sha256 text,
  expected_upload_type text
)
returns public.data_uploads
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_upload public.data_uploads%rowtype;
  raw_count integer;
begin
  if actor_id is null or auth.role() <> 'authenticated' then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if expected_content_sha256 is null
    or expected_content_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'invalid_source_digest';
  end if;

  select *
  into target_upload
  from public.data_uploads
  where id = target_upload_id;

  if target_upload.id is null
    or not private.has_permission(target_upload.organization_id, 'data.manage') then
    raise exception using errcode = '42501', message = 'permission_denied';
  end if;

  if target_upload.upload_type <> expected_upload_type then
    raise exception using errcode = '22023', message = 'wrong_upload_type';
  end if;

  if target_upload.content_sha256 is null
    or target_upload.content_sha256 <> expected_content_sha256 then
    raise exception using errcode = '22023', message = 'source_changed';
  end if;

  if target_upload.status not in ('parsed', 'ready', 'consolidated') then
    raise exception using errcode = '22023', message = 'upload_not_ready_for_approval';
  end if;

  select count(*)::integer
  into raw_count
  from public.raw_upload_rows
  where organization_id = target_upload.organization_id
    and upload_id = target_upload.id;

  if raw_count <> target_upload.row_count or raw_count < 1 then
    raise exception using errcode = '22023', message = 'review_row_count_changed';
  end if;

  if exists (
    select 1
    from public.validation_issues
    where organization_id = target_upload.organization_id
      and upload_id = target_upload.id
      and (
        severity = 'blocking'
        or (severity = 'warning' and accepted_at is null)
      )
  ) then
    raise exception using errcode = '22023', message = 'validation_not_clear';
  end if;

  return target_upload;
end;
$$;

create or replace function public.approve_product_master_records(
  target_upload_id uuid,
  expected_content_sha256 text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_upload public.data_uploads%rowtype;
  existing_run_id uuid;
  run_id uuid := gen_random_uuid();
  row_record record;
  payload jsonb;
  sku_code_value text;
  product_name_value text;
  style_code_value text;
  cost_text text;
  cost_value numeric(18, 4);
  currency_value text;
  product_id uuid;
  sku_exists boolean;
  inserted_total integer := 0;
  updated_total integer := 0;
begin
  target_upload := private.assert_external_upload_approvable(
    target_upload_id,
    expected_content_sha256,
    'product_csv'
  );

  select id
  into existing_run_id
  from public.external_record_approval_runs
  where organization_id = target_upload.organization_id
    and upload_id = target_upload.id
    and record_type = 'product_master';
  if existing_run_id is not null then
    return existing_run_id;
  end if;
  if target_upload.status = 'consolidated' then
    raise exception using errcode = '22023', message = 'upload_already_consolidated';
  end if;

  for row_record in
    select *
    from public.raw_upload_rows
    where organization_id = target_upload.organization_id
      and upload_id = target_upload.id
    order by row_number
  loop
    payload := row_record.payload;
    sku_code_value := nullif(trim(coalesce(
      payload ->> 'sku_code',
      payload ->> 'sku',
      payload ->> 'variant_sku'
    )), '');
    product_name_value := nullif(trim(coalesce(
      payload ->> 'product_name',
      payload ->> 'name',
      payload ->> 'title',
      sku_code_value
    )), '');
    style_code_value := nullif(trim(coalesce(
      payload ->> 'style_code',
      payload ->> 'product_code',
      sku_code_value
    )), '');
    cost_text := nullif(trim(coalesce(
      payload ->> 'approved_unit_cost',
      payload ->> 'unit_cost',
      payload ->> 'cost'
    )), '');
    cost_value := null;
    if cost_text is not null and cost_text ~ '^[0-9]+(\.[0-9]{1,4})?$' then
      cost_value := cost_text::numeric(18, 4);
    end if;
    currency_value := upper(nullif(trim(payload ->> 'currency_code'), ''));
    if currency_value is not null and currency_value !~ '^[A-Z]{3}$' then
      currency_value := null;
    end if;

    if sku_code_value is null or product_name_value is null or style_code_value is null then
      raise exception using errcode = '22023', message = 'product_review_row_invalid';
    end if;

    select exists (
      select 1
      from public.skus
      where organization_id = target_upload.organization_id
        and sku_code = sku_code_value
    ) into sku_exists;

    insert into public.products (
      organization_id,
      name,
      style_code,
      created_by
    )
    values (
      target_upload.organization_id,
      product_name_value,
      style_code_value,
      actor_id
    )
    on conflict (organization_id, style_code)
    do update set
      name = excluded.name,
      updated_at = timezone('utc', now())
    returning id into product_id;

    insert into public.skus (
      organization_id,
      product_id,
      sku_code,
      approved_unit_cost,
      currency_code,
      created_by
    )
    values (
      target_upload.organization_id,
      product_id,
      sku_code_value,
      cost_value,
      currency_value,
      actor_id
    )
    on conflict (organization_id, sku_code)
    do update set
      product_id = excluded.product_id,
      approved_unit_cost = coalesce(excluded.approved_unit_cost, public.skus.approved_unit_cost),
      currency_code = coalesce(excluded.currency_code, public.skus.currency_code),
      updated_at = timezone('utc', now());

    if sku_exists then
      updated_total := updated_total + 1;
    else
      inserted_total := inserted_total + 1;
    end if;
  end loop;

  insert into public.external_record_approval_runs (
    id,
    organization_id,
    upload_id,
    record_type,
    source_sha256,
    source_row_count,
    inserted_count,
    updated_count,
    approved_by
  ) values (
    run_id,
    target_upload.organization_id,
    target_upload.id,
    'product_master',
    target_upload.content_sha256,
    target_upload.row_count,
    inserted_total,
    updated_total,
    actor_id
  );

  update public.data_uploads
  set status = 'consolidated'
  where organization_id = target_upload.organization_id
    and id = target_upload.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_upload.organization_id,
    actor_id,
    'external_records.product_master.approved',
    'external_record_approval_run',
    run_id,
    jsonb_build_object('upload_id', target_upload.id, 'source_sha256', target_upload.content_sha256)
  );

  return run_id;
end;
$$;

create or replace function public.approve_store_master_records(
  target_upload_id uuid,
  expected_content_sha256 text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_upload public.data_uploads%rowtype;
  existing_run_id uuid;
  run_id uuid := gen_random_uuid();
  row_record record;
  payload jsonb;
  location_code_value text;
  location_name_value text;
  timezone_value text;
  inserted_total integer := 0;
  updated_total integer := 0;
begin
  target_upload := private.assert_external_upload_approvable(
    target_upload_id,
    expected_content_sha256,
    'store_csv'
  );

  select id
  into existing_run_id
  from public.external_record_approval_runs
  where organization_id = target_upload.organization_id
    and upload_id = target_upload.id
    and record_type = 'store_master';
  if existing_run_id is not null then
    return existing_run_id;
  end if;
  if target_upload.status = 'consolidated' then
    raise exception using errcode = '22023', message = 'upload_already_consolidated';
  end if;

  for row_record in
    select *
    from public.raw_upload_rows
    where organization_id = target_upload.organization_id
      and upload_id = target_upload.id
    order by row_number
  loop
    payload := row_record.payload;
    location_code_value := lower(nullif(trim(coalesce(
      payload ->> 'location_code',
      payload ->> 'store_code',
      payload ->> 'code'
    )), ''));
    location_name_value := nullif(trim(coalesce(
      payload ->> 'location_name',
      payload ->> 'store_name',
      payload ->> 'name'
    )), '');
    timezone_value := nullif(trim(coalesce(payload ->> 'timezone', 'Africa/Lagos')), '');
    if timezone_value is null or timezone_value ~ '[[:cntrl:]]' then
      timezone_value := 'Africa/Lagos';
    end if;

    if location_code_value is null
      or location_code_value !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      or location_name_value is null then
      raise exception using errcode = '22023', message = 'store_review_row_invalid';
    end if;

    if exists (
      select 1
      from public.locations
      where organization_id = target_upload.organization_id
        and code = location_code_value
    ) then
      updated_total := updated_total + 1;
    else
      inserted_total := inserted_total + 1;
    end if;

    insert into public.locations (
      organization_id,
      name,
      code,
      timezone,
      created_by
    )
    values (
      target_upload.organization_id,
      location_name_value,
      location_code_value,
      timezone_value,
      actor_id
    )
    on conflict (organization_id, code)
    do update set
      name = excluded.name,
      timezone = excluded.timezone,
      updated_at = timezone('utc', now());
  end loop;

  insert into public.external_record_approval_runs (
    id,
    organization_id,
    upload_id,
    record_type,
    source_sha256,
    source_row_count,
    inserted_count,
    updated_count,
    approved_by
  ) values (
    run_id,
    target_upload.organization_id,
    target_upload.id,
    'store_master',
    target_upload.content_sha256,
    target_upload.row_count,
    inserted_total,
    updated_total,
    actor_id
  );

  update public.data_uploads
  set status = 'consolidated'
  where organization_id = target_upload.organization_id
    and id = target_upload.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_upload.organization_id,
    actor_id,
    'external_records.store_master.approved',
    'external_record_approval_run',
    run_id,
    jsonb_build_object('upload_id', target_upload.id, 'source_sha256', target_upload.content_sha256)
  );

  return run_id;
end;
$$;

create or replace function public.approve_sales_history_records(
  target_upload_id uuid,
  expected_content_sha256 text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_upload public.data_uploads%rowtype;
  existing_run_id uuid;
  run_id uuid := gen_random_uuid();
  row_record record;
  payload jsonb;
  sku_code_value text;
  location_code_value text;
  quantity_text text;
  quantity_value integer;
  sold_at_text text;
  gross_amount_text text;
  gross_amount_value numeric(18, 4);
  currency_value text;
  sku_id_value uuid;
  location_id_value uuid;
  inserted_total integer := 0;
begin
  target_upload := private.assert_external_upload_approvable(
    target_upload_id,
    expected_content_sha256,
    'sales_csv'
  );

  select id
  into existing_run_id
  from public.external_record_approval_runs
  where organization_id = target_upload.organization_id
    and upload_id = target_upload.id
    and record_type = 'sales_history';
  if existing_run_id is not null then
    return existing_run_id;
  end if;
  if target_upload.status = 'consolidated' then
    raise exception using errcode = '22023', message = 'upload_already_consolidated';
  end if;

  for row_record in
    select *
    from public.raw_upload_rows
    where organization_id = target_upload.organization_id
      and upload_id = target_upload.id
    order by row_number
  loop
    payload := row_record.payload;
    sku_code_value := nullif(trim(coalesce(
      payload ->> 'sku_code',
      payload ->> 'sku',
      payload ->> 'variant_sku'
    )), '');
    location_code_value := lower(nullif(trim(coalesce(
      payload ->> 'location_code',
      payload ->> 'store_code',
      payload ->> 'location'
    )), ''));
    quantity_text := nullif(trim(coalesce(payload ->> 'quantity', payload ->> 'units_sold')), '');
    quantity_value := null;
    if quantity_text is not null and quantity_text ~ '^[0-9]+$' then
      quantity_value := quantity_text::integer;
    end if;
    sold_at_text := nullif(trim(coalesce(
      payload ->> 'sold_at',
      payload ->> 'sale_date',
      payload ->> 'transaction_date'
    )), '');
    gross_amount_text := nullif(trim(coalesce(payload ->> 'gross_amount', payload ->> 'amount')), '');
    gross_amount_value := null;
    if gross_amount_text is not null and gross_amount_text ~ '^[0-9]+(\.[0-9]{1,4})?$' then
      gross_amount_value := gross_amount_text::numeric(18, 4);
    end if;
    currency_value := upper(nullif(trim(payload ->> 'currency_code'), ''));
    if currency_value is not null and currency_value !~ '^[A-Z]{3}$' then
      currency_value := null;
    end if;

    select id into sku_id_value
    from public.skus
    where organization_id = target_upload.organization_id
      and sku_code = sku_code_value;

    select id into location_id_value
    from public.locations
    where organization_id = target_upload.organization_id
      and code = location_code_value;

    if sku_id_value is null
      or location_id_value is null
      or quantity_value is null
      or quantity_value <= 0
      or sold_at_text is null
      or sold_at_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' then
      raise exception using errcode = '22023', message = 'sales_review_row_invalid';
    end if;

    insert into public.sales_facts (
      organization_id,
      upload_id,
      sku_id,
      location_id,
      sold_at,
      quantity,
      gross_amount,
      currency_code,
      source_record_key
    ) values (
      target_upload.organization_id,
      target_upload.id,
      sku_id_value,
      location_id_value,
      left(sold_at_text, 10)::date,
      quantity_value,
      gross_amount_value,
      currency_value,
      coalesce(payload ->> 'source_record_key', row_record.id::text)
    );
    inserted_total := inserted_total + 1;
  end loop;

  insert into public.external_record_approval_runs (
    id,
    organization_id,
    upload_id,
    record_type,
    source_sha256,
    source_row_count,
    inserted_count,
    updated_count,
    approved_by
  ) values (
    run_id,
    target_upload.organization_id,
    target_upload.id,
    'sales_history',
    target_upload.content_sha256,
    target_upload.row_count,
    inserted_total,
    0,
    actor_id
  );

  update public.data_uploads
  set status = 'consolidated'
  where organization_id = target_upload.organization_id
    and id = target_upload.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_upload.organization_id,
    actor_id,
    'external_records.sales_history.approved',
    'external_record_approval_run',
    run_id,
    jsonb_build_object('upload_id', target_upload.id, 'source_sha256', target_upload.content_sha256)
  );

  return run_id;
end;
$$;

revoke all on function private.assert_external_upload_approvable(uuid, text, text) from public;
revoke all on function public.approve_product_master_records(uuid, text) from public, anon;
revoke all on function public.approve_store_master_records(uuid, text) from public, anon;
revoke all on function public.approve_sales_history_records(uuid, text) from public, anon;

grant execute on function public.approve_product_master_records(uuid, text) to authenticated;
grant execute on function public.approve_store_master_records(uuid, text) to authenticated;
grant execute on function public.approve_sales_history_records(uuid, text) to authenticated;

comment on table public.external_record_approval_runs is
  'Approval evidence for Phase 0.5 canonical writes from normalized product, store, and sales external records.';
