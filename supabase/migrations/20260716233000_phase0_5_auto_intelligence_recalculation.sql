begin;

-- Phase 0.5: automatic, auditable intelligence recalculation evidence after
-- accepted pipeline writes. Inventory consolidation can run the existing
-- deterministic scoring engine. Product/store/sales approval events are
-- recorded honestly as skipped because Phase 0 scoring reads approved
-- inventory positions, not standalone product, location, or sales facts.

create table public.intelligence_recalculation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_type text not null check (source_type in ('inventory_consolidation', 'external_record_approval')),
  source_id uuid not null,
  source_record_type text check (
    source_record_type is null
    or source_record_type in ('product_master', 'store_master', 'sales_history')
  ),
  trigger_mode text not null default 'automatic' check (trigger_mode = 'automatic'),
  status text not null check (status in ('completed', 'skipped', 'failed')),
  intelligence_run_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, intelligence_run_id)
    references public.intelligence_runs(organization_id, id) on delete restrict
);

create unique index intelligence_recalculation_source_idx
  on public.intelligence_recalculation_runs (
    organization_id,
    source_type,
    source_id,
    coalesce(source_record_type, '')
  );

create index intelligence_recalculation_org_requested_idx
  on public.intelligence_recalculation_runs (organization_id, requested_at desc);

alter table public.intelligence_recalculation_runs enable row level security;
alter table public.intelligence_recalculation_runs force row level security;

create policy intelligence_recalculation_runs_select
  on public.intelligence_recalculation_runs
  for select to authenticated
  using (private.has_permission(organization_id, 'data.view'));

revoke all on table public.intelligence_recalculation_runs from anon, authenticated;
grant select on table public.intelligence_recalculation_runs to authenticated;

create or replace function private.record_phase0_5_intelligence_recalculation(
  target_organization_id uuid,
  actor_id uuid,
  source_type_value text,
  source_id_value uuid,
  source_record_type_value text default null,
  metadata_value jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  recalculation_id uuid := gen_random_uuid();
  existing_recalculation_id uuid;
  latest_snapshot_id uuid;
  generated_intelligence_run_id uuid;
  final_status text;
  final_reason text;
begin
  if target_organization_id is null or actor_id is null or source_id_value is null then
    raise exception using errcode = '22023', message = 'invalid_recalculation_request';
  end if;

  select id
  into existing_recalculation_id
  from public.intelligence_recalculation_runs
  where organization_id = target_organization_id
    and source_type = source_type_value
    and source_id = source_id_value
    and source_record_type is not distinct from source_record_type_value;
  if existing_recalculation_id is not null then
    return existing_recalculation_id;
  end if;

  select id
  into latest_snapshot_id
  from public.inventory_snapshots
  where organization_id = target_organization_id
    and status = 'approved'
  order by observed_at desc, id desc
  limit 1;

  if source_type_value = 'external_record_approval' then
    final_status := 'skipped';
    final_reason := 'canonical_record_type_not_inventory_scored';
  elsif latest_snapshot_id is null then
    final_status := 'skipped';
    final_reason := 'approved_snapshot_required';
  else
    begin
      generated_intelligence_run_id := public.run_inventory_recovery_intelligence();

      if not exists (
        select 1
        from public.intelligence_runs
        where organization_id = target_organization_id
          and id = generated_intelligence_run_id
      ) then
        raise exception using errcode = '42501', message = 'intelligence_scope_mismatch';
      end if;

      final_status := 'completed';
      final_reason := null;
    exception
      when others then
        generated_intelligence_run_id := null;
        final_status := 'failed';
        final_reason := left(sqlerrm, 240);
    end;
  end if;

  insert into public.intelligence_recalculation_runs (
    id,
    organization_id,
    source_type,
    source_id,
    source_record_type,
    status,
    intelligence_run_id,
    reason,
    metadata,
    requested_by
  ) values (
    recalculation_id,
    target_organization_id,
    source_type_value,
    source_id_value,
    source_record_type_value,
    final_status,
    generated_intelligence_run_id,
    final_reason,
    coalesce(metadata_value, '{}'::jsonb)
      || jsonb_build_object('latest_snapshot_id', latest_snapshot_id),
    actor_id
  );

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id,
    actor_id,
    'intelligence.recalculation.' || final_status,
    'intelligence_recalculation_run',
    recalculation_id,
    jsonb_build_object(
      'source_type', source_type_value,
      'source_id', source_id_value,
      'source_record_type', source_record_type_value,
      'intelligence_run_id', generated_intelligence_run_id,
      'reason', final_reason
    )
  );

  return recalculation_id;
end;
$$;

create or replace function private.handle_phase0_5_consolidation_recalculation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' then
    perform private.record_phase0_5_intelligence_recalculation(
      new.organization_id,
      new.approved_by,
      'inventory_consolidation',
      new.id,
      null,
      jsonb_build_object(
        'upload_id', new.upload_id,
        'snapshot_id', new.snapshot_id,
        'source_sha256', new.source_sha256,
        'source_row_count', new.source_row_count
      )
    );
  end if;

  return new;
end;
$$;

create or replace function private.handle_phase0_5_external_approval_recalculation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.record_phase0_5_intelligence_recalculation(
    new.organization_id,
    new.approved_by,
    'external_record_approval',
    new.id,
    new.record_type,
    jsonb_build_object(
      'upload_id', new.upload_id,
      'source_sha256', new.source_sha256,
      'source_row_count', new.source_row_count,
      'inserted_count', new.inserted_count,
      'updated_count', new.updated_count
    )
  );

  return new;
end;
$$;

create constraint trigger phase0_5_consolidation_recalculation_trigger
after insert on public.consolidation_runs
deferrable initially deferred
for each row
execute function private.handle_phase0_5_consolidation_recalculation();

create constraint trigger phase0_5_external_approval_recalculation_trigger
after insert on public.external_record_approval_runs
deferrable initially deferred
for each row
execute function private.handle_phase0_5_external_approval_recalculation();

revoke all on function private.record_phase0_5_intelligence_recalculation(uuid, uuid, text, uuid, text, jsonb) from public;
revoke all on function private.handle_phase0_5_consolidation_recalculation() from public;
revoke all on function private.handle_phase0_5_external_approval_recalculation() from public;

comment on table public.intelligence_recalculation_runs is
  'Tenant-scoped evidence for automatic Phase 0.5 intelligence recalculation attempts after approved ingestion pipeline writes.';

commit;
