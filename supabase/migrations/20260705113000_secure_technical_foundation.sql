begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

create type public.organization_role as enum (
  'org_owner',
  'executive',
  'merchandising_manager',
  'store_manager',
  'viewer'
);

create type public.membership_status as enum (
  'active',
  'invited',
  'suspended'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (
    char_length(slug) between 2 and 64
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null,
  status public.membership_status not null default 'active',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 3 and 120),
  target_type text not null check (char_length(target_type) between 2 and 80),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index memberships_user_active_idx
  on public.memberships (user_id, organization_id)
  where status = 'active';

create index memberships_organization_idx
  on public.memberships (organization_id, status);

create index audit_events_organization_created_idx
  on public.audit_events (organization_id, created_at desc);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

create trigger memberships_set_updated_at
before update on public.memberships
for each row execute function private.set_updated_at();

create function private.has_permission(
  target_organization_id uuid,
  required_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and case membership.role
        when 'org_owner' then required_permission = any (array[
          'organization.view',
          'organization.manage',
          'members.view',
          'members.manage',
          'audit.view'
        ])
        when 'executive' then required_permission = any (array[
          'organization.view',
          'members.view',
          'audit.view'
        ])
        when 'merchandising_manager' then required_permission = 'organization.view'
        when 'store_manager' then required_permission = 'organization.view'
        when 'viewer' then required_permission = 'organization.view'
        else false
      end
  );
$$;

create function private.create_organization_impl(
  organization_name text,
  organization_slug text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  new_organization_id uuid;
begin
  if caller_id is null or auth.role() <> 'authenticated' then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  -- Serialize onboarding attempts per user so concurrent retries cannot create
  -- more than one initial organization/membership.
  perform pg_advisory_xact_lock(hashtextextended(caller_id::text, 0));

  if char_length(trim(organization_name)) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'invalid_organization_name';
  end if;

  if char_length(organization_slug) not between 2 and 64
    or organization_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  then
    raise exception using errcode = '22023', message = 'invalid_organization_slug';
  end if;

  if exists (
    select 1
    from public.memberships
    where user_id = caller_id
      and status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'onboarding_already_completed';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (trim(organization_name), organization_slug, caller_id)
  returning id into new_organization_id;

  insert into public.memberships (
    organization_id,
    user_id,
    role,
    status,
    created_by
  )
  values (
    new_organization_id,
    caller_id,
    'org_owner',
    'active',
    caller_id
  );

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  )
  values (
    new_organization_id,
    caller_id,
    'organization.created',
    'organization',
    new_organization_id,
    jsonb_build_object('initial_role', 'org_owner')
  );

  return new_organization_id;
end;
$$;

create function public.create_organization(
  organization_name text,
  organization_slug text
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_organization_impl(
    organization_name,
    organization_slug
  );
$$;

alter table public.organizations enable row level security;
alter table public.organizations force row level security;
alter table public.memberships enable row level security;
alter table public.memberships force row level security;
alter table public.audit_events enable row level security;
alter table public.audit_events force row level security;

create policy organizations_select
on public.organizations
for select
to authenticated
using (private.has_permission(id, 'organization.view'));

create policy organizations_update
on public.organizations
for update
to authenticated
using (private.has_permission(id, 'organization.manage'))
with check (private.has_permission(id, 'organization.manage'));

create policy memberships_select
on public.memberships
for select
to authenticated
using (
  (
    user_id = (select auth.uid())
    and status = 'active'
  )
  or private.has_permission(organization_id, 'members.view')
);

create policy audit_events_select
on public.audit_events
for select
to authenticated
using (private.has_permission(organization_id, 'audit.view'));

revoke all on table public.organizations from anon, authenticated;
revoke all on table public.memberships from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

grant select on table public.organizations to authenticated;
grant update (name, slug, updated_at) on table public.organizations to authenticated;
grant select on table public.memberships to authenticated;
grant select on table public.audit_events to authenticated;

revoke all on function private.has_permission(uuid, text) from public;
revoke all on function private.create_organization_impl(text, text) from public;
revoke all on function public.create_organization(text, text) from public;

grant usage on schema private to authenticated;
grant execute on function private.has_permission(uuid, text) to authenticated;
grant execute on function private.create_organization_impl(text, text) to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;

comment on function public.create_organization(text, text) is
  'Authenticated onboarding entry point. Creates an organization, owner membership, and audit event atomically.';

commit;
