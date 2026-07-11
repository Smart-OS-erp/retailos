begin;

-- Phase 0 Milestone 3: reviewed intake becomes canonical inventory only through
-- an atomic, idempotent, audited database function.

alter table public.inventory_positions
  add column units_sold_90 integer check (units_sold_90 is null or units_sold_90 >= 0),
  add column units_sold_30 integer check (units_sold_30 is null or units_sold_30 >= 0);

create table public.consolidation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  upload_id uuid not null,
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  approval_evidence_sha256 text not null check (approval_evidence_sha256 ~ '^[a-f0-9]{64}$'),
  source_row_count integer not null check (source_row_count between 1 and 10000),
  status text not null check (status in ('completed', 'failed')),
  snapshot_id uuid,
  inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  excluded_count integer not null default 0 check (excluded_count >= 0),
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, upload_id),
  foreign key (organization_id, upload_id) references public.data_uploads(organization_id, id) on delete restrict,
  foreign key (organization_id, snapshot_id) references public.inventory_snapshots(organization_id, id) on delete restrict,
  check (
    (status = 'completed' and snapshot_id is not null and completed_at is not null)
    or (status = 'failed' and snapshot_id is null)
  )
);

create table public.consolidation_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  consolidation_run_id uuid not null,
  staging_row_id uuid not null,
  sku_id uuid not null,
  location_id uuid not null,
  outcome text not null check (outcome in ('inserted', 'updated')),
  source_evidence jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, consolidation_run_id, staging_row_id),
  foreign key (organization_id, consolidation_run_id) references public.consolidation_runs(organization_id, id) on delete cascade,
  foreign key (organization_id, staging_row_id) references public.staging_inventory_rows(organization_id, id) on delete restrict,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create index consolidation_runs_org_created_idx
  on public.consolidation_runs (organization_id, created_at desc);
create index consolidation_items_run_idx
  on public.consolidation_items (organization_id, consolidation_run_id);

drop policy categories_select on public.categories;
drop policy products_select on public.products;
drop policy skus_select on public.skus;
create policy categories_select on public.categories for select to authenticated
  using (private.has_permission(organization_id, 'inventory.view'));
create policy products_select on public.products for select to authenticated
  using (private.has_permission(organization_id, 'inventory.view'));
create policy skus_select on public.skus for select to authenticated
  using (private.has_permission(organization_id, 'inventory.view'));

alter table public.consolidation_runs enable row level security;
alter table public.consolidation_runs force row level security;
alter table public.consolidation_items enable row level security;
alter table public.consolidation_items force row level security;

create policy consolidation_runs_select on public.consolidation_runs
  for select to authenticated
  using (private.has_permission(organization_id, 'data.view'));
create policy consolidation_items_select on public.consolidation_items
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'inventory.view'));

revoke all on table public.consolidation_runs from anon, authenticated;
revoke all on table public.consolidation_items from anon, authenticated;
grant select on table public.consolidation_runs to authenticated;
grant select on table public.consolidation_items to authenticated;

create or replace function public.accept_inventory_upload_warnings(
  target_upload_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_organization_id uuid;
  target_status text;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select organization_id, status
  into target_organization_id, target_status
  from public.data_uploads
  where id = target_upload_id
  for update;

  if target_organization_id is null
    or not private.has_permission(target_organization_id, 'data.manage') then
    raise exception 'permission_denied';
  end if;
  if target_status <> 'parsed' then
    raise exception 'upload_not_warning_reviewable';
  end if;
  if exists (
    select 1
    from public.validation_issues
    where organization_id = target_organization_id
      and upload_id = target_upload_id
      and severity = 'blocking'
  ) then
    raise exception 'blocking_issues_present';
  end if;

  update public.validation_issues
  set accepted_at = timezone('utc', now()), accepted_by = actor_id
  where organization_id = target_organization_id
    and upload_id = target_upload_id
    and severity = 'warning'
    and accepted_at is null;

  update public.staging_inventory_rows
  set validation_status = 'valid'
  where organization_id = target_organization_id
    and upload_id = target_upload_id
    and validation_status = 'warning';

  update public.data_uploads
  set status = 'ready',
      warnings_accepted_at = timezone('utc', now()),
      warnings_accepted_by = actor_id
  where organization_id = target_organization_id
    and id = target_upload_id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id,
    actor_id,
    'data_upload.warnings_accepted',
    'data_upload',
    target_upload_id,
    jsonb_build_object('rule_version', 'phase0-v1')
  );
end;
$$;

create or replace function public.consolidate_inventory_upload(
  target_upload_id uuid,
  expected_content_sha256 text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_organization_id uuid;
  source_sha256 text;
  source_rows integer;
  upload_status text;
  existing_run_id uuid;
  run_id uuid := gen_random_uuid();
  snapshot_id uuid := gen_random_uuid();
  approval_hash text;
  staged record;
  product_id uuid;
  sku_id uuid;
  sku_existed boolean;
  inserted_total integer := 0;
  updated_total integer := 0;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;
  if expected_content_sha256 is null
    or expected_content_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_source_digest';
  end if;

  select organization_id, content_sha256, row_count, status
  into target_organization_id, source_sha256, source_rows, upload_status
  from public.data_uploads
  where id = target_upload_id
  for update;

  if target_organization_id is null
    or not private.has_permission(target_organization_id, 'data.manage') then
    raise exception 'permission_denied';
  end if;

  select id into existing_run_id
  from public.consolidation_runs
  where organization_id = target_organization_id
    and upload_id = target_upload_id
    and status = 'completed';
  if existing_run_id is not null then
    if source_sha256 <> expected_content_sha256 then
      raise exception 'source_changed';
    end if;
    return existing_run_id;
  end if;

  if source_sha256 is null or source_sha256 <> expected_content_sha256 then
    raise exception 'source_changed';
  end if;
  if upload_status <> 'ready' then
    raise exception 'upload_not_ready';
  end if;
  if source_rows < 1 then
    raise exception 'empty_upload';
  end if;
  if (
    select count(*)
    from public.staging_inventory_rows
    where organization_id = target_organization_id
      and upload_id = target_upload_id
  ) <> source_rows then
    raise exception 'staging_row_count_changed';
  end if;
  if exists (
    select 1
    from public.staging_inventory_rows
    where organization_id = target_organization_id
      and upload_id = target_upload_id
      and (
        validation_status <> 'valid'
        or location_id is null
        or sku_code is null
        or on_hand_quantity is null
      )
  ) or exists (
    select 1
    from public.validation_issues
    where organization_id = target_organization_id
      and upload_id = target_upload_id
      and (
        severity = 'blocking'
        or (severity = 'warning' and accepted_at is null)
      )
  ) then
    raise exception 'validation_not_clear';
  end if;

  -- The upload checksum is already SHA-256. The approved row count and upload
  -- identifier are stored beside it as the immutable approval evidence tuple.
  approval_hash := source_sha256;

  update public.inventory_snapshots
  set status = 'superseded'
  where organization_id = target_organization_id
    and status = 'approved';

  insert into public.inventory_snapshots (
    id, organization_id, upload_id, observed_at, status, created_by
  ) values (
    snapshot_id, target_organization_id, target_upload_id,
    timezone('utc', now()), 'approved', actor_id
  );

  insert into public.consolidation_runs (
    id, organization_id, upload_id, source_sha256, approval_evidence_sha256,
    source_row_count, status, snapshot_id, approved_by, completed_at
  ) values (
    run_id, target_organization_id, target_upload_id, source_sha256,
    approval_hash, source_rows, 'completed', snapshot_id, actor_id,
    timezone('utc', now())
  );

  for staged in
    select *
    from public.staging_inventory_rows
    where organization_id = target_organization_id
      and upload_id = target_upload_id
    order by created_at, id
  loop
    select id into sku_id
    from public.skus
    where organization_id = target_organization_id
      and sku_code = staged.sku_code;
    sku_existed := sku_id is not null;

    if not sku_existed then
      select id into product_id
      from public.products
      where organization_id = target_organization_id
        and style_code = staged.sku_code;

      if product_id is null then
        product_id := gen_random_uuid();
        insert into public.products (
          id, organization_id, name, style_code, created_by
        ) values (
          product_id,
          target_organization_id,
          coalesce(nullif(staged.product_name, ''), staged.sku_code),
          staged.sku_code,
          actor_id
        );
      end if;

      sku_id := gen_random_uuid();
      insert into public.skus (
        id, organization_id, product_id, sku_code, approved_unit_cost,
        currency_code, created_by
      ) values (
        sku_id, target_organization_id, product_id, staged.sku_code,
        staged.approved_unit_cost, staged.currency_code, actor_id
      );
      inserted_total := inserted_total + 1;
    else
      update public.skus
      set approved_unit_cost = coalesce(staged.approved_unit_cost, approved_unit_cost),
          currency_code = coalesce(staged.currency_code, currency_code)
      where organization_id = target_organization_id
        and id = sku_id;
      updated_total := updated_total + 1;
    end if;

    insert into public.inventory_positions (
      organization_id, snapshot_id, sku_id, location_id, on_hand_quantity,
      approved_unit_cost, currency_code, first_available_at,
      units_sold_90, units_sold_30
    ) values (
      target_organization_id, snapshot_id, sku_id, staged.location_id,
      staged.on_hand_quantity, staged.approved_unit_cost, staged.currency_code,
      staged.first_available_at, staged.units_sold_90, staged.units_sold_30
    );

    insert into public.consolidation_items (
      organization_id, consolidation_run_id, staging_row_id, sku_id,
      location_id, outcome, source_evidence
    ) values (
      target_organization_id, run_id, staged.id, sku_id, staged.location_id,
      case when sku_existed then 'updated' else 'inserted' end,
      jsonb_build_object(
        'upload_id', target_upload_id,
        'raw_row_id', staged.raw_row_id,
        'source_sha256', source_sha256,
        'rule_version', 'phase0-v1'
      )
    );
  end loop;

  update public.consolidation_runs
  set inserted_count = inserted_total,
      updated_count = updated_total
  where organization_id = target_organization_id
    and id = run_id;

  update public.data_uploads
  set status = 'consolidated'
  where organization_id = target_organization_id
    and id = target_upload_id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id,
    actor_id,
    'inventory_upload.consolidated',
    'consolidation_run',
    run_id,
    jsonb_build_object(
      'upload_id', target_upload_id,
      'source_sha256', source_sha256,
      'approval_evidence_sha256', approval_hash,
      'source_row_count', source_rows,
      'snapshot_id', snapshot_id
    )
  );

  insert into public.event_log (
    organization_id, scope, event_type, aggregate_type, aggregate_id,
    payload, idempotency_key
  ) values (
    target_organization_id,
    'organization',
    'inventory.consolidated',
    'consolidation_run',
    run_id,
    jsonb_build_object(
      'upload_id', target_upload_id,
      'snapshot_id', snapshot_id,
      'source_row_count', source_rows
    ),
    'consolidation:' || target_upload_id::text
  );

  return run_id;
end;
$$;

revoke all on function public.accept_inventory_upload_warnings(uuid) from public, anon;
revoke all on function public.consolidate_inventory_upload(uuid, text) from public, anon;
grant execute on function public.accept_inventory_upload_warnings(uuid) to authenticated;
grant execute on function public.consolidate_inventory_upload(uuid, text) to authenticated;

create view public.current_inventory_positions
with (security_invoker = true)
as
select
  position.id,
  position.organization_id,
  position.snapshot_id,
  snapshot.observed_at,
  position.sku_id,
  sku.sku_code,
  product.id as product_id,
  product.name as product_name,
  product.brand_id,
  position.location_id,
  location.name as location_name,
  location.code as location_code,
  position.on_hand_quantity,
  position.approved_unit_cost,
  position.currency_code,
  position.first_available_at,
  position.units_sold_90,
  position.units_sold_30
from public.inventory_positions as position
join public.inventory_snapshots as snapshot
  on snapshot.organization_id = position.organization_id
 and snapshot.id = position.snapshot_id
 and snapshot.status = 'approved'
join public.skus as sku
  on sku.organization_id = position.organization_id
 and sku.id = position.sku_id
join public.products as product
  on product.organization_id = position.organization_id
 and product.id = sku.product_id
join public.locations as location
  on location.organization_id = position.organization_id
 and location.id = position.location_id;

revoke all on table public.current_inventory_positions from anon, authenticated;
grant select on table public.current_inventory_positions to authenticated;

commit;
