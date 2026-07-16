-- Phase 0.5 scheduled sync foundation.
-- This adds schedule metadata only. Scheduled execution must remain protected
-- by CRON_SECRET and provider workers must still write raw external_records
-- before any normalization/consolidation path.

create table public.data_source_sync_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid not null,
  status text not null default 'enabled' check (status in ('enabled', 'paused')),
  interval_minutes integer not null default 1440 check (
    interval_minutes in (60, 360, 720, 1440)
  ),
  next_run_at timestamptz not null default timezone('utc', now()),
  locked_until timestamptz,
  last_enqueued_at timestamptz,
  last_sync_job_id uuid,
  failure_count integer not null default 0 check (failure_count between 0 and 1000),
  run_as_user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, data_source_id),
  foreign key (organization_id, data_source_id)
    references public.data_sources(organization_id, id) on delete cascade,
  foreign key (organization_id, last_sync_job_id)
    references public.sync_jobs(organization_id, id) on delete set null
);

create index data_source_sync_schedules_due_idx
  on public.data_source_sync_schedules (status, next_run_at, locked_until)
  where status = 'enabled';

create trigger data_source_sync_schedules_set_updated_at
before update on public.data_source_sync_schedules
for each row execute function private.set_updated_at();

create trigger data_source_sync_schedules_audit_change
after insert or update on public.data_source_sync_schedules
for each row execute function private.audit_phase0_5_integration_change();

alter table public.data_source_sync_schedules enable row level security;
alter table public.data_source_sync_schedules force row level security;

create policy data_source_sync_schedules_select
on public.data_source_sync_schedules
for select
using (private.has_permission(organization_id, 'integration.view'));

create policy data_source_sync_schedules_insert
on public.data_source_sync_schedules
for insert
with check (
  private.has_permission(organization_id, 'integration.manage')
  and created_by = auth.uid()
  and run_as_user_id = auth.uid()
);

create policy data_source_sync_schedules_update
on public.data_source_sync_schedules
for update
using (private.has_permission(organization_id, 'integration.manage'))
with check (private.has_permission(organization_id, 'integration.manage'));

revoke all on table public.data_source_sync_schedules from anon, authenticated;
grant select on table public.data_source_sync_schedules to authenticated;
grant insert (
  organization_id,
  data_source_id,
  status,
  interval_minutes,
  next_run_at
) on table public.data_source_sync_schedules to authenticated;
grant update (
  status,
  interval_minutes,
  next_run_at
) on table public.data_source_sync_schedules to authenticated;

comment on table public.data_source_sync_schedules is
  'Tenant-scoped Phase 0.5 scheduled sync metadata. Cron execution is protected by CRON_SECRET and must enqueue sync_jobs before provider access.';
