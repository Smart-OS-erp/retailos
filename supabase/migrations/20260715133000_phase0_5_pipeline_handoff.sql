begin;

-- Phase 0.5 Milestone 7: hand off tenant-scoped external records into the
-- existing Phase 0 upload/staging/validation path. This migration does not
-- consolidate, recalculate intelligence, call provider APIs, or create
-- scheduled workers.

create table public.external_record_normalization_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid not null,
  sync_job_id uuid not null,
  upload_id uuid not null,
  status text not null check (status in ('completed', 'failed')),
  external_record_count integer not null check (external_record_count between 1 and 10000),
  normalized_count integer not null default 0 check (normalized_count >= 0),
  validation_blocked_count integer not null default 0 check (validation_blocked_count >= 0),
  warning_count integer not null default 0 check (warning_count >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  unique (organization_id, id),
  unique (organization_id, sync_job_id),
  unique (organization_id, upload_id),
  foreign key (organization_id, data_source_id)
    references public.data_sources(organization_id, id) on delete cascade,
  foreign key (organization_id, sync_job_id)
    references public.sync_jobs(organization_id, id) on delete cascade,
  foreign key (organization_id, upload_id)
    references public.data_uploads(organization_id, id) on delete restrict,
  check (
    (status = 'completed' and completed_at is not null)
    or (status = 'failed' and completed_at is null)
  )
);

create index external_record_normalization_runs_org_created_idx
  on public.external_record_normalization_runs (organization_id, created_at desc);

alter table public.external_record_normalization_runs enable row level security;
alter table public.external_record_normalization_runs force row level security;

create policy external_record_normalization_runs_select
on public.external_record_normalization_runs
for select
to authenticated
using (private.has_permission(organization_id, 'data.view'));

revoke all on table public.external_record_normalization_runs from anon, authenticated;
grant select on table public.external_record_normalization_runs to authenticated;

create or replace function public.normalize_external_records(
  target_sync_job_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_job public.sync_jobs%rowtype;
  target_source public.data_sources%rowtype;
  existing_upload_id uuid;
  upload_id uuid := gen_random_uuid();
  run_id uuid := gen_random_uuid();
  row_number integer := 0;
  record_count integer := 0;
  normalized_total integer := 0;
  blocked_total integer := 0;
  warning_total integer := 0;
  upload_digest text;
  source_record record;
  raw_row_id uuid;
  staging_row_id uuid;
  payload jsonb;
  normalized_record_type text;
  location_code_value text;
  resolved_location_id uuid;
  sku_code_value text;
  product_name_value text;
  quantity_text text;
  on_hand_value integer;
  cost_text text;
  cost_value numeric(18, 4);
  currency_value text;
  first_available_text text;
  first_available_value date;
  units_90_text text;
  units_90_value integer;
  units_30_text text;
  units_30_value integer;
  row_blocking_count integer;
  row_warning_count integer;
  issue_message text;
begin
  if actor_id is null or auth.role() <> 'authenticated' then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select *
  into target_job
  from public.sync_jobs
  where id = target_sync_job_id
  for update;

  if target_job.id is null then
    raise exception using errcode = '22023', message = 'sync_job_not_found';
  end if;

  if not private.has_permission(target_job.organization_id, 'integration.import')
    or not private.has_permission(target_job.organization_id, 'data.manage') then
    raise exception using errcode = '42501', message = 'permission_denied';
  end if;

  select *
  into target_source
  from public.data_sources
  where organization_id = target_job.organization_id
    and id = target_job.data_source_id
  for update;

  if target_source.id is null
    or target_source.status in ('disabled', 'paused') then
    raise exception using errcode = '42501', message = 'data_source_not_importable';
  end if;

  select normalization_run.upload_id
  into existing_upload_id
  from public.external_record_normalization_runs as normalization_run
  where normalization_run.organization_id = target_job.organization_id
    and normalization_run.sync_job_id = target_job.id
    and normalization_run.status = 'completed';

  if existing_upload_id is not null then
    return existing_upload_id;
  end if;

  select count(*)::integer
  into record_count
  from public.external_records
  where organization_id = target_job.organization_id
    and data_source_id = target_job.data_source_id
    and sync_job_id = target_job.id
    and status in ('received', 'validation_blocked');

  if record_count < 1 then
    raise exception using errcode = '22023', message = 'no_external_records';
  end if;

  upload_digest := md5('retailos:phase0.5:external-records:' || target_job.id::text)
    || md5('retailos:phase0.5:external-records:v2:' || target_job.id::text);

  insert into public.data_uploads (
    id,
    organization_id,
    upload_type,
    file_name,
    content_sha256,
    byte_size,
    row_count,
    status,
    created_by
  )
  select
    upload_id,
    target_job.organization_id,
    'inventory_csv',
    left('integration-' || target_source.source_key || '-' || target_job.id::text || '.json', 180),
    upload_digest,
    least(coalesce(sum(octet_length(external_record.payload::text)), 0), 2097152)::integer,
    record_count,
    'received',
    actor_id
  from public.external_records as external_record
  where external_record.organization_id = target_job.organization_id
    and external_record.data_source_id = target_job.data_source_id
    and external_record.sync_job_id = target_job.id
    and external_record.status in ('received', 'validation_blocked');

  insert into public.external_record_normalization_runs (
    id,
    organization_id,
    data_source_id,
    sync_job_id,
    upload_id,
    status,
    external_record_count,
    created_by
  )
  values (
    run_id,
    target_job.organization_id,
    target_job.data_source_id,
    target_job.id,
    upload_id,
    'failed',
    record_count,
    actor_id
  );

  for source_record in
    select *
    from public.external_records
    where organization_id = target_job.organization_id
      and data_source_id = target_job.data_source_id
      and sync_job_id = target_job.id
      and status in ('received', 'validation_blocked')
    order by received_at, id
  loop
    row_number := row_number + 1;
    payload := source_record.payload;
    normalized_record_type := replace(source_record.record_type, '.', '_');
    row_blocking_count := 0;
    row_warning_count := 0;

    insert into public.raw_upload_rows (
      organization_id,
      upload_id,
      row_number,
      payload
    )
    values (
      target_job.organization_id,
      upload_id,
      row_number,
      payload
    )
    returning id into raw_row_id;

    location_code_value := lower(nullif(trim(coalesce(
      payload ->> 'location_code',
      payload ->> 'location',
      payload ->> 'store_code',
      payload ->> 'store'
    )), ''));

    resolved_location_id := null;
    if location_code_value is not null then
      select id
      into resolved_location_id
      from public.locations
      where organization_id = target_job.organization_id
        and code = location_code_value
      limit 1;
    end if;

    sku_code_value := nullif(trim(coalesce(
      payload ->> 'sku_code',
      payload ->> 'sku',
      payload ->> 'variant_sku',
      source_record.source_record_key
    )), '');
    product_name_value := nullif(trim(coalesce(
      payload ->> 'product_name',
      payload ->> 'name',
      payload ->> 'title',
      sku_code_value
    )), '');

    quantity_text := nullif(trim(coalesce(
      payload ->> 'on_hand_quantity',
      payload ->> 'quantity',
      payload ->> 'qty',
      payload ->> 'available'
    )), '');
    on_hand_value := null;
    if quantity_text is not null and quantity_text ~ '^[0-9]+$' then
      on_hand_value := quantity_text::integer;
    end if;

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
      row_warning_count := row_warning_count + 1;
    end if;

    first_available_text := nullif(trim(coalesce(
      payload ->> 'first_available_at',
      payload ->> 'first_seen_at',
      payload ->> 'received_at'
    )), '');
    first_available_value := null;
    if first_available_text is not null and first_available_text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' then
      first_available_value := left(first_available_text, 10)::date;
    end if;

    units_90_text := nullif(trim(payload ->> 'units_sold_90'), '');
    units_90_value := null;
    if units_90_text is not null and units_90_text ~ '^[0-9]+$' then
      units_90_value := units_90_text::integer;
    end if;

    units_30_text := nullif(trim(payload ->> 'units_sold_30'), '');
    units_30_value := null;
    if units_30_text is not null and units_30_text ~ '^[0-9]+$' then
      units_30_value := units_30_text::integer;
    end if;

    if normalized_record_type <> 'inventory_snapshot' then
      row_blocking_count := row_blocking_count + 1;
    end if;
    if sku_code_value is null then
      row_blocking_count := row_blocking_count + 1;
    end if;
    if location_code_value is null or resolved_location_id is null then
      row_blocking_count := row_blocking_count + 1;
    end if;
    if on_hand_value is null then
      row_blocking_count := row_blocking_count + 1;
    end if;

    insert into public.staging_inventory_rows (
      organization_id,
      upload_id,
      raw_row_id,
      location_id,
      sku_code,
      product_name,
      location_code,
      on_hand_quantity,
      approved_unit_cost,
      currency_code,
      first_available_at,
      units_sold_90,
      units_sold_30,
      validation_status
    )
    values (
      target_job.organization_id,
      upload_id,
      raw_row_id,
      resolved_location_id,
      sku_code_value,
      product_name_value,
      location_code_value,
      on_hand_value,
      cost_value,
      currency_value,
      first_available_value,
      units_90_value,
      units_30_value,
      case
        when row_blocking_count > 0 then 'blocked'
        when row_warning_count > 0 then 'warning'
        else 'valid'
      end
    )
    returning id into staging_row_id;

    if normalized_record_type <> 'inventory_snapshot' then
      issue_message := 'Only inventory_snapshot external records can normalize into inventory staging in this milestone.';
      insert into public.validation_issues (
        organization_id, upload_id, staging_row_id, severity, issue_code, message
      ) values (
        target_job.organization_id, upload_id, staging_row_id, 'blocking',
        'unsupported_external_record_type', issue_message
      );
      insert into public.sync_errors (
        organization_id, sync_job_id, external_record_id, severity, error_code,
        message, retryable
      ) values (
        target_job.organization_id, target_job.id, source_record.id, 'error',
        'normalization.unsupported_record_type', issue_message, false
      );
    end if;

    if sku_code_value is null then
      issue_message := 'External inventory record is missing a SKU code.';
      insert into public.validation_issues (
        organization_id, upload_id, staging_row_id, severity, issue_code, message
      ) values (
        target_job.organization_id, upload_id, staging_row_id, 'blocking',
        'missing_sku_code', issue_message
      );
      insert into public.sync_errors (
        organization_id, sync_job_id, external_record_id, severity, error_code,
        message, retryable
      ) values (
        target_job.organization_id, target_job.id, source_record.id, 'error',
        'normalization.missing_sku_code', issue_message, false
      );
    end if;

    if location_code_value is null or resolved_location_id is null then
      issue_message := 'External inventory record location code does not match an organization location.';
      insert into public.validation_issues (
        organization_id, upload_id, staging_row_id, severity, issue_code, message
      ) values (
        target_job.organization_id, upload_id, staging_row_id, 'blocking',
        'unresolved_location_code', issue_message
      );
      insert into public.sync_errors (
        organization_id, sync_job_id, external_record_id, severity, error_code,
        message, retryable
      ) values (
        target_job.organization_id, target_job.id, source_record.id, 'error',
        'normalization.unresolved_location_code', issue_message, false
      );
    end if;

    if on_hand_value is null then
      issue_message := 'External inventory record has a missing or invalid on-hand quantity.';
      insert into public.validation_issues (
        organization_id, upload_id, staging_row_id, severity, issue_code, message
      ) values (
        target_job.organization_id, upload_id, staging_row_id, 'blocking',
        'invalid_on_hand_quantity', issue_message
      );
      insert into public.sync_errors (
        organization_id, sync_job_id, external_record_id, severity, error_code,
        message, retryable
      ) values (
        target_job.organization_id, target_job.id, source_record.id, 'error',
        'normalization.invalid_on_hand_quantity', issue_message, false
      );
    end if;

    if row_warning_count > 0 then
      issue_message := 'External inventory record has a malformed optional currency value.';
      insert into public.validation_issues (
        organization_id, upload_id, staging_row_id, severity, issue_code, message
      ) values (
        target_job.organization_id, upload_id, staging_row_id, 'warning',
        'invalid_optional_currency', issue_message
      );
      insert into public.sync_errors (
        organization_id, sync_job_id, external_record_id, severity, error_code,
        message, retryable
      ) values (
        target_job.organization_id, target_job.id, source_record.id, 'warning',
        'normalization.invalid_optional_currency', issue_message, false
      );
    end if;

    if row_blocking_count > 0 then
      blocked_total := blocked_total + 1;
      update public.external_records
      set status = 'validation_blocked'
      where organization_id = target_job.organization_id
        and id = source_record.id;
    else
      normalized_total := normalized_total + 1;
      if row_warning_count > 0 then
        warning_total := warning_total + 1;
      end if;
      update public.external_records
      set status = 'normalized',
          normalized_at = timezone('utc', now())
      where organization_id = target_job.organization_id
        and id = source_record.id;
    end if;
  end loop;

  update public.data_uploads
  set status = case
      when blocked_total > 0 then 'validation_blocked'
      when warning_total > 0 then 'parsed'
      else 'ready'
    end,
    row_count = record_count
  where organization_id = target_job.organization_id
    and id = upload_id;

  update public.sync_jobs
  set status = case
      when normalized_total = record_count then 'succeeded'::public.sync_job_status
      when normalized_total > 0 then 'partially_succeeded'::public.sync_job_status
      else 'failed'::public.sync_job_status
    end,
    finished_at = timezone('utc', now()),
    error_summary = case
      when blocked_total > 0 then 'External records normalized with validation blockers.'
      when warning_total > 0 then 'External records normalized with validation warnings.'
      else null
    end
  where organization_id = target_job.organization_id
    and id = target_job.id;

  update public.external_record_normalization_runs
  set status = 'completed',
      normalized_count = normalized_total,
      validation_blocked_count = blocked_total,
      warning_count = warning_total,
      completed_at = timezone('utc', now())
  where organization_id = target_job.organization_id
    and id = run_id;

  update public.data_sources
  set status = case
      when blocked_total > 0 then 'error'::public.data_source_status
      else 'connected'::public.data_source_status
    end,
    last_successful_sync_at = case
      when normalized_total > 0 then timezone('utc', now())
      else last_successful_sync_at
    end,
    last_error_at = case
      when blocked_total > 0 then timezone('utc', now())
      else last_error_at
    end
  where organization_id = target_job.organization_id
    and id = target_job.data_source_id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_job.organization_id,
    actor_id,
    'integration.external_records.normalized',
    'external_record_normalization_run',
    run_id,
    jsonb_build_object(
      'sync_job_id', target_job.id,
      'data_source_id', target_job.data_source_id,
      'upload_id', upload_id,
      'record_count', record_count,
      'normalized_count', normalized_total,
      'validation_blocked_count', blocked_total,
      'warning_count', warning_total
    )
  );

  insert into public.event_log (
    organization_id, scope, event_type, aggregate_type, aggregate_id, payload,
    idempotency_key
  ) values (
    target_job.organization_id,
    'organization',
    'integration.external_records.normalized',
    'external_record_normalization_run',
    run_id,
    jsonb_build_object(
      'sync_job_id', target_job.id,
      'data_source_id', target_job.data_source_id,
      'upload_id', upload_id,
      'record_count', record_count
    ),
    'external-record-normalization:' || target_job.id::text
  );

  return upload_id;
end;
$$;

revoke all on function public.normalize_external_records(uuid) from public, anon;
grant execute on function public.normalize_external_records(uuid) to authenticated;

comment on table public.external_record_normalization_runs is
  'Audit envelope linking Phase 0.5 external records to Phase 0 upload/staging/validation without bypassing consolidation.';

comment on function public.normalize_external_records(uuid) is
  'Normalizes one tenant-scoped sync job into data_uploads/raw_upload_rows/staging_inventory_rows/validation_issues. It does not consolidate canonical inventory.';

commit;
