begin;

-- Phase 0.5 Milestone 1: Integration Hub foundation.
-- This migration establishes tenant-scoped ingestion contracts only. It does
-- not add real provider OAuth, scheduled workers, POS, payments, or autonomous
-- execution.

create type public.integration_connector_depth as enum (
  'manual',
  'scaffold',
  'mvp',
  'api'
);

create type public.data_source_status as enum (
  'draft',
  'configuration_required',
  'connected',
  'syncing',
  'paused',
  'disabled',
  'error'
);

create type public.integration_credential_status as enum (
  'not_required',
  'missing',
  'configured',
  'expired',
  'revoked'
);

create type public.sync_job_status as enum (
  'queued',
  'running',
  'succeeded',
  'partially_succeeded',
  'failed',
  'cancelled'
);

create type public.sync_job_trigger as enum (
  'manual',
  'scheduled',
  'webhook',
  'api'
);

create type public.external_record_status as enum (
  'received',
  'mapped',
  'validation_blocked',
  'normalized',
  'ignored',
  'error'
);

create type public.webhook_event_status as enum (
  'received',
  'verified',
  'processed',
  'failed',
  'ignored'
);

create table public.integration_providers (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique check (
    char_length(provider_key) between 2 and 64
    and provider_key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'
  ),
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  source_system text not null check (
    source_system in (
      'manual_file',
      'shopify',
      'woocommerce',
      'google_sheets',
      'pos_erp',
      'custom_backend',
      'import_api'
    )
  ),
  default_connector_depth public.integration_connector_depth not null,
  default_credential_status public.integration_credential_status not null,
  supports_manual_sync boolean not null default false,
  supports_webhooks boolean not null default false,
  is_enabled boolean not null default true,
  help_text text not null check (char_length(help_text) between 8 and 500),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (default_connector_depth in ('manual', 'api') and default_credential_status = 'not_required')
    or (default_connector_depth in ('scaffold', 'mvp') and default_credential_status in ('missing', 'configured'))
  )
);

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_id uuid not null references public.integration_providers(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 120),
  source_key text not null check (
    char_length(source_key) between 2 and 80
    and source_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  connector_depth public.integration_connector_depth not null,
  status public.data_source_status not null default 'draft',
  credential_status public.integration_credential_status not null default 'missing',
  connection_metadata jsonb not null default '{}'::jsonb,
  last_sync_requested_at timestamptz,
  last_successful_sync_at timestamptz,
  last_error_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, provider_id, source_key),
  check (octet_length(connection_metadata::text) <= 8192),
  check (
    status <> 'connected'
    or credential_status in ('not_required', 'configured')
  )
);

create table public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid not null,
  trigger public.sync_job_trigger not null,
  status public.sync_job_status not null default 'queued',
  idempotency_key text check (
    idempotency_key is null
    or char_length(idempotency_key) between 8 and 160
  ),
  requested_by uuid references auth.users(id) on delete set null,
  attempt_count integer not null default 0 check (attempt_count between 0 and 100),
  started_at timestamptz,
  finished_at timestamptz,
  error_summary text check (error_summary is null or char_length(error_summary) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, data_source_id, idempotency_key),
  foreign key (organization_id, data_source_id)
    references public.data_sources(organization_id, id) on delete cascade,
  check (
    (status in ('succeeded', 'partially_succeeded', 'failed', 'cancelled') and finished_at is not null)
    or (status in ('queued', 'running') and finished_at is null)
  )
);

create table public.external_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid not null,
  sync_job_id uuid,
  location_id uuid,
  record_type text not null check (
    char_length(record_type) between 2 and 80
    and record_type ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'
  ),
  source_record_key text not null check (char_length(source_record_key) between 1 and 200),
  source_updated_at timestamptz,
  payload jsonb not null,
  payload_hash text not null check (
    char_length(payload_hash) between 16 and 128
    and payload_hash ~ '^[a-zA-Z0-9._:-]+$'
  ),
  status public.external_record_status not null default 'received',
  received_by uuid references auth.users(id) on delete set null,
  received_at timestamptz not null default timezone('utc', now()),
  normalized_at timestamptz,
  unique (organization_id, id),
  unique (organization_id, data_source_id, record_type, source_record_key),
  foreign key (organization_id, data_source_id)
    references public.data_sources(organization_id, id) on delete cascade,
  foreign key (organization_id, sync_job_id)
    references public.sync_jobs(organization_id, id) on delete set null,
  foreign key (organization_id, location_id)
    references public.locations(organization_id, id) on delete restrict,
  check (octet_length(payload::text) <= 1048576),
  check (
    (status = 'normalized' and normalized_at is not null)
    or (status <> 'normalized' and normalized_at is null)
  )
);

create table public.sync_errors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sync_job_id uuid not null,
  external_record_id uuid,
  severity text not null default 'error' check (severity in ('warning', 'error', 'critical')),
  error_code text not null check (
    char_length(error_code) between 3 and 80
    and error_code ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'
  ),
  message text not null check (char_length(trim(message)) between 3 and 500),
  retryable boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, sync_job_id)
    references public.sync_jobs(organization_id, id) on delete cascade,
  foreign key (organization_id, external_record_id)
    references public.external_records(organization_id, id) on delete set null
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid not null,
  provider_event_id text not null check (char_length(provider_event_id) between 3 and 200),
  event_type text not null check (
    char_length(event_type) between 3 and 120
    and event_type ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'
  ),
  signature_verified boolean not null default false,
  status public.webhook_event_status not null default 'received',
  payload jsonb not null,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  error_message text check (error_message is null or char_length(error_message) <= 500),
  unique (organization_id, id),
  unique (organization_id, data_source_id, provider_event_id),
  foreign key (organization_id, data_source_id)
    references public.data_sources(organization_id, id) on delete cascade,
  check (octet_length(payload::text) <= 1048576),
  check (
    (status in ('processed', 'failed', 'ignored') and processed_at is not null)
    or (status in ('received', 'verified') and processed_at is null)
  )
);

create index data_sources_organization_status_idx
  on public.data_sources (organization_id, status, updated_at desc);

create index sync_jobs_source_status_idx
  on public.sync_jobs (organization_id, data_source_id, status, created_at desc);

create index external_records_source_status_idx
  on public.external_records (organization_id, data_source_id, status, received_at desc);

create index sync_errors_job_idx
  on public.sync_errors (organization_id, sync_job_id, severity, created_at desc);

create index webhook_events_source_status_idx
  on public.webhook_events (organization_id, data_source_id, status, received_at desc);

create trigger integration_providers_set_updated_at
before update on public.integration_providers
for each row execute function private.set_updated_at();

create trigger data_sources_set_updated_at
before update on public.data_sources
for each row execute function private.set_updated_at();

create trigger sync_jobs_set_updated_at
before update on public.sync_jobs
for each row execute function private.set_updated_at();

create or replace function private.role_has_permission(
  target_role public.organization_role,
  required_permission text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case target_role
    when 'org_owner' then required_permission = any (array[
      'organization.view','organization.manage','members.view','members.manage','audit.view',
      'location.view','location.manage','brand.view','brand.manage','onboarding.view','onboarding.manage','event.view',
      'data.view','data.manage','inventory.view','intelligence.run','opportunity.view',
      'project.view','project.manage','project.approve','task.view','task.manage',
      'campaign_brief.view','campaign_brief.manage','campaign_brief.approve','copilot.use',
      'integration.view','integration.manage','integration.sync','integration.import'
    ])
    when 'executive' then required_permission = any (array[
      'organization.view','members.view','audit.view','location.view','brand.view','onboarding.view','event.view',
      'data.view','inventory.view','opportunity.view','project.view','project.approve',
      'task.view','campaign_brief.view','campaign_brief.approve','copilot.use',
      'integration.view'
    ])
    when 'merchandising_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','brand.manage','data.view','data.manage',
      'inventory.view','intelligence.run','opportunity.view','project.view','project.manage',
      'task.view','task.manage','campaign_brief.view','campaign_brief.manage','copilot.use',
      'integration.view','integration.manage','integration.sync','integration.import'
    ])
    when 'store_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','inventory.view','opportunity.view',
      'project.view','task.view','task.manage','campaign_brief.view','copilot.use'
    ])
    when 'viewer' then required_permission = any (array[
      'organization.view','location.view','brand.view','data.view','inventory.view','opportunity.view',
      'project.view','task.view','campaign_brief.view','copilot.use'
    ])
    else false
  end;
$$;

create function private.has_active_membership()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as membership
    where membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

create function private.audit_phase0_5_integration_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_row record;
begin
  if tg_op = 'DELETE' then
    changed_row := old;
  else
    changed_row := new;
  end if;

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  )
  values (
    changed_row.organization_id,
    auth.uid(),
    lower('integration.' || tg_table_name || '.' || tg_op),
    tg_table_name,
    changed_row.id,
    jsonb_build_object('operation', lower(tg_op))
  );

  insert into public.event_log (
    organization_id,
    scope,
    event_type,
    aggregate_type,
    aggregate_id,
    payload
  )
  values (
    changed_row.organization_id,
    'organization',
    lower('integration.' || tg_table_name || '.' || tg_op),
    tg_table_name,
    changed_row.id,
    '{}'::jsonb
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger data_sources_audit_change
after insert or update on public.data_sources
for each row execute function private.audit_phase0_5_integration_change();

create trigger sync_jobs_audit_change
after insert or update on public.sync_jobs
for each row execute function private.audit_phase0_5_integration_change();

create trigger external_records_audit_change
after insert or update on public.external_records
for each row execute function private.audit_phase0_5_integration_change();

create trigger sync_errors_audit_change
after insert on public.sync_errors
for each row execute function private.audit_phase0_5_integration_change();

create trigger webhook_events_audit_change
after insert or update on public.webhook_events
for each row execute function private.audit_phase0_5_integration_change();

create function private.create_data_source_impl(
  target_organization_id uuid,
  target_provider_key text,
  target_name text,
  requested_connector_depth public.integration_connector_depth default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  provider public.integration_providers%rowtype;
  selected_depth public.integration_connector_depth;
  initial_credential_status public.integration_credential_status;
  initial_status public.data_source_status;
  normalized_source_key text;
  new_data_source_id uuid;
begin
  if caller_id is null or auth.role() <> 'authenticated' then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if not private.has_permission(target_organization_id, 'integration.manage') then
    raise exception using errcode = '42501', message = 'permission_denied';
  end if;

  select *
  into provider
  from public.integration_providers
  where provider_key = target_provider_key
    and is_enabled;

  if provider.id is null then
    raise exception using errcode = '22023', message = 'unsupported_provider';
  end if;

  selected_depth := coalesce(requested_connector_depth, provider.default_connector_depth);

  if selected_depth = 'mvp' and provider.default_connector_depth = 'scaffold' then
    raise exception using errcode = '22023', message = 'provider_mvp_not_approved';
  end if;

  normalized_source_key := lower(regexp_replace(trim(target_name), '[^a-zA-Z0-9]+', '-', 'g'));
  normalized_source_key := trim(both '-' from normalized_source_key);

  if char_length(normalized_source_key) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'invalid_data_source_name';
  end if;

  initial_credential_status := provider.default_credential_status;
  initial_status := case
    when initial_credential_status = 'not_required' then 'connected'::public.data_source_status
    else 'configuration_required'::public.data_source_status
  end;

  insert into public.data_sources (
    organization_id,
    provider_id,
    name,
    source_key,
    connector_depth,
    status,
    credential_status,
    created_by
  )
  values (
    target_organization_id,
    provider.id,
    trim(target_name),
    normalized_source_key,
    selected_depth,
    initial_status,
    initial_credential_status,
    caller_id
  )
  returning id into new_data_source_id;

  return new_data_source_id;
end;
$$;

create function public.create_data_source(
  target_organization_id uuid,
  target_provider_key text,
  target_name text,
  requested_connector_depth public.integration_connector_depth default null
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_data_source_impl(
    target_organization_id,
    target_provider_key,
    target_name,
    requested_connector_depth
  );
$$;

create function private.enqueue_data_source_sync_impl(
  target_data_source_id uuid,
  target_idempotency_key text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  source public.data_sources%rowtype;
  existing_job_id uuid;
  new_job_id uuid;
begin
  if caller_id is null or auth.role() <> 'authenticated' then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select *
  into source
  from public.data_sources
  where id = target_data_source_id;

  if source.id is null
    or not private.has_permission(source.organization_id, 'integration.sync') then
    raise exception using errcode = '42501', message = 'permission_denied';
  end if;

  if target_idempotency_key is not null then
    select id
    into existing_job_id
    from public.sync_jobs
    where organization_id = source.organization_id
      and data_source_id = source.id
      and idempotency_key = target_idempotency_key;

    if existing_job_id is not null then
      return existing_job_id;
    end if;
  end if;

  if source.status in ('disabled', 'paused') then
    raise exception using errcode = '42501', message = 'data_source_not_syncable';
  end if;

  if source.credential_status not in ('not_required', 'configured') then
    insert into public.sync_jobs (
      organization_id,
      data_source_id,
      trigger,
      status,
      idempotency_key,
      requested_by,
      finished_at,
      error_summary
    )
    values (
      source.organization_id,
      source.id,
      'manual',
      'failed',
      target_idempotency_key,
      caller_id,
      timezone('utc', now()),
      'Connector credentials are not configured.'
    )
    returning id into new_job_id;

    insert into public.sync_errors (
      organization_id,
      sync_job_id,
      severity,
      error_code,
      message,
      retryable
    )
    values (
      source.organization_id,
      new_job_id,
      'error',
      'credentials.missing',
      'Connector credentials are not configured for this data source.',
      false
    );

    update public.data_sources
    set
      status = 'error',
      last_sync_requested_at = timezone('utc', now()),
      last_error_at = timezone('utc', now())
    where id = source.id;

    return new_job_id;
  end if;

  insert into public.sync_jobs (
    organization_id,
    data_source_id,
    trigger,
    status,
    idempotency_key,
    requested_by
  )
  values (
    source.organization_id,
    source.id,
    'manual',
    'queued',
    target_idempotency_key,
    caller_id
  )
  returning id into new_job_id;

  update public.data_sources
  set
    status = 'syncing',
    last_sync_requested_at = timezone('utc', now())
  where id = source.id;

  return new_job_id;
end;
$$;

create function public.enqueue_data_source_sync(
  target_data_source_id uuid,
  target_idempotency_key text default null
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.enqueue_data_source_sync_impl(
    target_data_source_id,
    target_idempotency_key
  );
$$;

alter table public.integration_providers enable row level security;
alter table public.integration_providers force row level security;
alter table public.data_sources enable row level security;
alter table public.data_sources force row level security;
alter table public.external_records enable row level security;
alter table public.external_records force row level security;
alter table public.sync_jobs enable row level security;
alter table public.sync_jobs force row level security;
alter table public.sync_errors enable row level security;
alter table public.sync_errors force row level security;
alter table public.webhook_events enable row level security;
alter table public.webhook_events force row level security;

create policy integration_providers_select
on public.integration_providers
for select
to authenticated
using (private.has_active_membership());

create policy data_sources_select
on public.data_sources
for select
to authenticated
using (private.has_permission(organization_id, 'integration.view'));

create policy data_sources_insert
on public.data_sources
for insert
to authenticated
with check (
  private.has_permission(organization_id, 'integration.manage')
  and created_by = (select auth.uid())
);

create policy data_sources_update
on public.data_sources
for update
to authenticated
using (private.has_permission(organization_id, 'integration.manage'))
with check (private.has_permission(organization_id, 'integration.manage'));

create policy external_records_select
on public.external_records
for select
to authenticated
using (private.has_permission(organization_id, 'integration.view'));

create policy external_records_insert
on public.external_records
for insert
to authenticated
with check (
  private.has_permission(organization_id, 'integration.import')
  and received_by = (select auth.uid())
);

create policy external_records_update
on public.external_records
for update
to authenticated
using (private.has_permission(organization_id, 'integration.import'))
with check (private.has_permission(organization_id, 'integration.import'));

create policy sync_jobs_select
on public.sync_jobs
for select
to authenticated
using (private.has_permission(organization_id, 'integration.view'));

create policy sync_jobs_insert
on public.sync_jobs
for insert
to authenticated
with check (
  private.has_permission(organization_id, 'integration.sync')
  and requested_by = (select auth.uid())
);

create policy sync_jobs_update
on public.sync_jobs
for update
to authenticated
using (private.has_permission(organization_id, 'integration.sync'))
with check (private.has_permission(organization_id, 'integration.sync'));

create policy sync_errors_select
on public.sync_errors
for select
to authenticated
using (private.has_permission(organization_id, 'integration.view'));

create policy sync_errors_insert
on public.sync_errors
for insert
to authenticated
with check (private.has_permission(organization_id, 'integration.sync'));

create policy webhook_events_select
on public.webhook_events
for select
to authenticated
using (private.has_permission(organization_id, 'integration.view'));

create policy webhook_events_insert
on public.webhook_events
for insert
to authenticated
with check (
  private.has_permission(organization_id, 'integration.import')
  and signature_verified
);

create policy webhook_events_update
on public.webhook_events
for update
to authenticated
using (private.has_permission(organization_id, 'integration.import'))
with check (private.has_permission(organization_id, 'integration.import'));

revoke all on table public.integration_providers from anon, authenticated;
revoke all on table public.data_sources from anon, authenticated;
revoke all on table public.external_records from anon, authenticated;
revoke all on table public.sync_jobs from anon, authenticated;
revoke all on table public.sync_errors from anon, authenticated;
revoke all on table public.webhook_events from anon, authenticated;

grant select on table public.integration_providers to authenticated;

grant select on table public.data_sources to authenticated;
grant insert (
  organization_id, provider_id, name, source_key, connector_depth, status,
  credential_status, connection_metadata, created_by
) on table public.data_sources to authenticated;
grant update (
  name, status, credential_status, connection_metadata, last_sync_requested_at,
  last_successful_sync_at, last_error_at, updated_at
) on table public.data_sources to authenticated;

grant select on table public.external_records to authenticated;
grant insert (
  organization_id, data_source_id, sync_job_id, location_id, record_type,
  source_record_key, source_updated_at, payload, payload_hash, status,
  received_by, normalized_at
) on table public.external_records to authenticated;
grant update (status, normalized_at)
  on table public.external_records to authenticated;

grant select on table public.sync_jobs to authenticated;
grant insert (
  organization_id, data_source_id, trigger, status, idempotency_key,
  requested_by, attempt_count, started_at, finished_at, error_summary
) on table public.sync_jobs to authenticated;
grant update (
  status, attempt_count, started_at, finished_at, error_summary, updated_at
) on table public.sync_jobs to authenticated;

grant select on table public.sync_errors to authenticated;
grant insert (
  organization_id, sync_job_id, external_record_id, severity, error_code,
  message, retryable
) on table public.sync_errors to authenticated;

grant select on table public.webhook_events to authenticated;
grant insert (
  organization_id, data_source_id, provider_event_id, event_type,
  signature_verified, status, payload, processed_at, error_message
) on table public.webhook_events to authenticated;
grant update (status, processed_at, error_message)
  on table public.webhook_events to authenticated;

revoke all on function private.has_active_membership() from public;
revoke all on function private.audit_phase0_5_integration_change() from public;
revoke all on function private.create_data_source_impl(uuid, text, text, public.integration_connector_depth) from public;
revoke all on function public.create_data_source(uuid, text, text, public.integration_connector_depth) from public;
revoke all on function private.enqueue_data_source_sync_impl(uuid, text) from public;
revoke all on function public.enqueue_data_source_sync(uuid, text) from public;

grant execute on function private.has_active_membership() to authenticated;
grant execute on function private.create_data_source_impl(uuid, text, text, public.integration_connector_depth) to authenticated;
grant execute on function public.create_data_source(uuid, text, text, public.integration_connector_depth) to authenticated;
grant execute on function private.enqueue_data_source_sync_impl(uuid, text) to authenticated;
grant execute on function public.enqueue_data_source_sync(uuid, text) to authenticated;

insert into public.integration_providers (
  provider_key,
  display_name,
  source_system,
  default_connector_depth,
  default_credential_status,
  supports_manual_sync,
  supports_webhooks,
  help_text
)
values
  (
    'csv_excel',
    'CSV / Excel',
    'manual_file',
    'manual',
    'not_required',
    false,
    false,
    'Manual file upload remains available and flows through validation before consolidation.'
  ),
  (
    'shopify',
    'Shopify',
    'shopify',
    'scaffold',
    'missing',
    true,
    true,
    'Shopify is scaffolded in Phase 0.5 until credentials and sync depth are approved.'
  ),
  (
    'woocommerce',
    'WooCommerce',
    'woocommerce',
    'scaffold',
    'missing',
    true,
    true,
    'WooCommerce is scaffolded in Phase 0.5 until credentials and sync depth are approved.'
  ),
  (
    'google_sheets',
    'Google Sheets',
    'google_sheets',
    'scaffold',
    'missing',
    true,
    false,
    'Google Sheets is scaffolded in Phase 0.5 until credentials and sync depth are approved.'
  ),
  (
    'pos_erp',
    'POS / ERP',
    'pos_erp',
    'scaffold',
    'missing',
    false,
    false,
    'POS and ERP sources require onboarding help or Import API configuration; RetailOS does not implement POS in Phase 0.5.'
  ),
  (
    'custom_backend',
    'Custom backend',
    'custom_backend',
    'scaffold',
    'missing',
    false,
    true,
    'Custom websites must connect through their backend, data feed, or Import API instead of direct website scraping.'
  ),
  (
    'import_api',
    'RetailOS Import API',
    'import_api',
    'api',
    'not_required',
    false,
    false,
    'The Import API accepts tenant-scoped records and sends them through validation before consolidation.'
  );

comment on table public.integration_providers is
  'Provider catalogue for Phase 0.5 Integration Hub. This is not a marketplace.';

comment on table public.data_sources is
  'Tenant-owned Integration Hub source configuration. Secrets are never stored here.';

comment on table public.external_records is
  'Tenant-scoped raw external records. These records must flow through validation before canonical consolidation.';

comment on table public.sync_jobs is
  'Tenant-scoped sync job envelope with idempotency and retry evidence.';

comment on table public.sync_errors is
  'Non-destructive sync error evidence for retry and support workflows.';

comment on table public.webhook_events is
  'Verified provider webhook events. Payloads are untrusted until signature verification and normalization.';

commit;
