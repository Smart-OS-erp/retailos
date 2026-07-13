begin;

-- Phase 0.5 Milestone 4: Import API credential and replay foundation.
-- This migration creates the secure control-plane needed before any public
-- Import API ingestion route exists. It stores only token hashes/prefixes,
-- tenant-scoped replay/idempotency evidence, and rate-limit evidence.
-- It does not implement /api/import/v1/records or normalize records.

create type public.import_api_credential_status as enum (
  'active',
  'revoked',
  'expired'
);

create type public.import_api_idempotency_status as enum (
  'reserved',
  'completed',
  'failed',
  'expired'
);

create table public.import_api_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid not null,
  label text not null check (char_length(trim(label)) between 2 and 120),
  token_prefix text not null check (
    char_length(token_prefix) between 8 and 32
    and token_prefix ~ '^rtos_[a-z0-9]+$'
  ),
  token_hash text not null check (
    char_length(token_hash) between 64 and 256
    and token_hash ~ '^[a-zA-Z0-9._:$/-]+$'
  ),
  hash_algorithm text not null default 'hmac-sha256' check (hash_algorithm = 'hmac-sha256'),
  status public.import_api_credential_status not null default 'active',
  created_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, data_source_id, token_prefix),
  unique (token_hash),
  foreign key (organization_id, data_source_id)
    references public.data_sources(organization_id, id) on delete cascade,
  check (
    (status = 'active' and revoked_at is null and revoked_by is null)
    or (status = 'revoked' and revoked_at is not null)
    or (status = 'expired')
  ),
  check (expires_at is null or expires_at > created_at)
);

create table public.import_api_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid not null,
  credential_id uuid not null,
  idempotency_key text not null check (
    char_length(idempotency_key) between 8 and 160
    and idempotency_key ~ '^[a-zA-Z0-9._:-]+$'
  ),
  request_hash text not null check (
    char_length(request_hash) between 32 and 128
    and request_hash ~ '^[a-zA-Z0-9._:-]+$'
  ),
  status public.import_api_idempotency_status not null default 'reserved',
  sync_job_id uuid,
  response_summary jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '24 hours'),
  unique (organization_id, id),
  unique (organization_id, data_source_id, idempotency_key),
  foreign key (organization_id, data_source_id)
    references public.data_sources(organization_id, id) on delete cascade,
  foreign key (organization_id, credential_id)
    references public.import_api_credentials(organization_id, id) on delete restrict,
  foreign key (organization_id, sync_job_id)
    references public.sync_jobs(organization_id, id) on delete set null,
  check (octet_length(response_summary::text) <= 4096),
  check (expires_at > first_seen_at),
  check (last_seen_at >= first_seen_at)
);

create table public.import_api_rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid not null,
  credential_id uuid not null,
  limit_name text not null check (
    char_length(limit_name) between 3 and 80
    and limit_name ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'
  ),
  window_started_at timestamptz not null,
  window_seconds integer not null check (window_seconds between 1 and 86400),
  request_count integer not null default 0 check (request_count >= 0),
  blocked_count integer not null default 0 check (blocked_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, credential_id, limit_name, window_started_at),
  foreign key (organization_id, data_source_id)
    references public.data_sources(organization_id, id) on delete cascade,
  foreign key (organization_id, credential_id)
    references public.import_api_credentials(organization_id, id) on delete cascade,
  check (blocked_count <= request_count)
);

create index import_api_credentials_source_status_idx
  on public.import_api_credentials (organization_id, data_source_id, status, created_at desc);

create index import_api_idempotency_source_status_idx
  on public.import_api_idempotency_keys (organization_id, data_source_id, status, first_seen_at desc);

create index import_api_rate_limit_source_window_idx
  on public.import_api_rate_limit_events (organization_id, data_source_id, limit_name, window_started_at desc);

create trigger import_api_credentials_set_updated_at
before update on public.import_api_credentials
for each row execute function private.set_updated_at();

create trigger import_api_idempotency_keys_audit_change
after insert or update on public.import_api_idempotency_keys
for each row execute function private.audit_phase0_5_integration_change();

create trigger import_api_rate_limit_events_audit_change
after insert or update on public.import_api_rate_limit_events
for each row execute function private.audit_phase0_5_integration_change();

create trigger import_api_credentials_audit_change
after insert or update on public.import_api_credentials
for each row execute function private.audit_phase0_5_integration_change();

create function private.import_api_source_for_manage(
  target_data_source_id uuid
)
returns public.data_sources
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  source public.data_sources%rowtype;
begin
  select data_source.*
  into source
  from public.data_sources as data_source
  join public.integration_providers as provider
    on provider.id = data_source.provider_id
  where data_source.id = target_data_source_id
    and provider.source_system = 'import_api';

  if source.id is null then
    raise exception using errcode = '22023', message = 'import_api_source_required';
  end if;

  if not private.has_permission(source.organization_id, 'integration.manage') then
    raise exception using errcode = '42501', message = 'permission_denied';
  end if;

  return source;
end;
$$;

create function private.create_import_api_credential_impl(
  target_data_source_id uuid,
  target_label text,
  target_token_prefix text,
  target_token_hash text,
  target_expires_at timestamptz default null
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
  new_credential_id uuid;
begin
  if caller_id is null or auth.role() <> 'authenticated' then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  source := private.import_api_source_for_manage(target_data_source_id);

  insert into public.import_api_credentials (
    organization_id,
    data_source_id,
    label,
    token_prefix,
    token_hash,
    created_by,
    expires_at
  )
  values (
    source.organization_id,
    source.id,
    trim(target_label),
    target_token_prefix,
    target_token_hash,
    caller_id,
    target_expires_at
  )
  returning id into new_credential_id;

  update public.data_sources
  set
    credential_status = 'configured',
    status = 'connected',
    connection_metadata = connection_metadata
      || jsonb_build_object('import_api_credentials_configured', true)
  where id = source.id;

  return new_credential_id;
end;
$$;

create function public.create_import_api_credential(
  target_data_source_id uuid,
  target_label text,
  target_token_prefix text,
  target_token_hash text,
  target_expires_at timestamptz default null
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_import_api_credential_impl(
    target_data_source_id,
    target_label,
    target_token_prefix,
    target_token_hash,
    target_expires_at
  );
$$;

create function private.revoke_import_api_credential_impl(
  target_credential_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  credential public.import_api_credentials%rowtype;
  active_count integer;
begin
  if caller_id is null or auth.role() <> 'authenticated' then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select *
  into credential
  from public.import_api_credentials
  where id = target_credential_id;

  if credential.id is null then
    raise exception using errcode = '42501', message = 'permission_denied';
  end if;

  perform private.import_api_source_for_manage(credential.data_source_id);

  update public.import_api_credentials
  set
    status = 'revoked',
    revoked_at = timezone('utc', now()),
    revoked_by = caller_id
  where id = credential.id
    and status = 'active';

  select count(*)
  into active_count
  from public.import_api_credentials
  where organization_id = credential.organization_id
    and data_source_id = credential.data_source_id
    and status = 'active'
    and (expires_at is null or expires_at > timezone('utc', now()));

  if active_count = 0 then
    update public.data_sources
    set credential_status = 'missing'
    where id = credential.data_source_id;
  end if;
end;
$$;

create function public.revoke_import_api_credential(
  target_credential_id uuid
)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.revoke_import_api_credential_impl(target_credential_id);
$$;

alter table public.import_api_credentials enable row level security;
alter table public.import_api_credentials force row level security;
alter table public.import_api_idempotency_keys enable row level security;
alter table public.import_api_idempotency_keys force row level security;
alter table public.import_api_rate_limit_events enable row level security;
alter table public.import_api_rate_limit_events force row level security;

create policy import_api_credentials_select
on public.import_api_credentials
for select
to authenticated
using (private.has_permission(organization_id, 'integration.manage'));

create policy import_api_credentials_insert
on public.import_api_credentials
for insert
to authenticated
with check (
  private.has_permission(organization_id, 'integration.manage')
  and created_by = (select auth.uid())
);

create policy import_api_credentials_update
on public.import_api_credentials
for update
to authenticated
using (private.has_permission(organization_id, 'integration.manage'))
with check (private.has_permission(organization_id, 'integration.manage'));

create policy import_api_idempotency_keys_select
on public.import_api_idempotency_keys
for select
to authenticated
using (private.has_permission(organization_id, 'integration.manage'));

create policy import_api_idempotency_keys_insert
on public.import_api_idempotency_keys
for insert
to authenticated
with check (private.has_permission(organization_id, 'integration.import'));

create policy import_api_idempotency_keys_update
on public.import_api_idempotency_keys
for update
to authenticated
using (private.has_permission(organization_id, 'integration.import'))
with check (private.has_permission(organization_id, 'integration.import'));

create policy import_api_rate_limit_events_select
on public.import_api_rate_limit_events
for select
to authenticated
using (private.has_permission(organization_id, 'integration.manage'));

create policy import_api_rate_limit_events_insert
on public.import_api_rate_limit_events
for insert
to authenticated
with check (private.has_permission(organization_id, 'integration.import'));

create policy import_api_rate_limit_events_update
on public.import_api_rate_limit_events
for update
to authenticated
using (private.has_permission(organization_id, 'integration.import'))
with check (private.has_permission(organization_id, 'integration.import'));

revoke all on table public.import_api_credentials from anon, authenticated;
revoke all on table public.import_api_idempotency_keys from anon, authenticated;
revoke all on table public.import_api_rate_limit_events from anon, authenticated;

grant select (
  id, organization_id, data_source_id, label, token_prefix, hash_algorithm,
  status, created_by, expires_at, last_used_at, revoked_at, revoked_by,
  created_at, updated_at
) on table public.import_api_credentials to authenticated;
grant insert (
  organization_id, data_source_id, label, token_prefix, token_hash, created_by,
  expires_at
) on table public.import_api_credentials to authenticated;
grant update (
  status, last_used_at, revoked_at, revoked_by, updated_at
) on table public.import_api_credentials to authenticated;

grant select on table public.import_api_idempotency_keys to authenticated;
grant insert (
  organization_id, data_source_id, credential_id, idempotency_key,
  request_hash, status, sync_job_id, response_summary, expires_at
) on table public.import_api_idempotency_keys to authenticated;
grant update (
  status, sync_job_id, response_summary, last_seen_at
) on table public.import_api_idempotency_keys to authenticated;

grant select on table public.import_api_rate_limit_events to authenticated;
grant insert (
  organization_id, data_source_id, credential_id, limit_name,
  window_started_at, window_seconds, request_count, blocked_count
) on table public.import_api_rate_limit_events to authenticated;
grant update (
  request_count, blocked_count
) on table public.import_api_rate_limit_events to authenticated;

revoke all on function private.import_api_source_for_manage(uuid) from public;
revoke all on function private.create_import_api_credential_impl(uuid, text, text, text, timestamptz) from public;
revoke all on function public.create_import_api_credential(uuid, text, text, text, timestamptz) from public;
revoke all on function private.revoke_import_api_credential_impl(uuid) from public;
revoke all on function public.revoke_import_api_credential(uuid) from public;

grant execute on function private.import_api_source_for_manage(uuid) to authenticated;
grant execute on function private.create_import_api_credential_impl(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function public.create_import_api_credential(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function private.revoke_import_api_credential_impl(uuid) to authenticated;
grant execute on function public.revoke_import_api_credential(uuid) to authenticated;

comment on table public.import_api_credentials is
  'Tenant-scoped Import API credential metadata and token hashes. Raw tokens are never stored here.';

comment on column public.import_api_credentials.token_hash is
  'Server-generated keyed hash of the Import API token. This column must never be selected by browser code.';

comment on table public.import_api_idempotency_keys is
  'Tenant-scoped Import API replay/idempotency evidence. This table supports safe retries before records enter external_records.';

comment on table public.import_api_rate_limit_events is
  'Tenant-scoped Import API rate-limit evidence for abuse controls and support review.';

commit;
