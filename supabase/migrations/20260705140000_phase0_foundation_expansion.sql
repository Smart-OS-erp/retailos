begin;

create type public.onboarding_step as enum (
  'company_profile',
  'first_location',
  'brands',
  'team',
  'data_source'
);

create type public.onboarding_step_status as enum (
  'not_started',
  'in_progress',
  'completed',
  'skipped'
);

create type public.event_scope as enum ('organization', 'location');

create type public.event_delivery_status as enum (
  'pending',
  'processing',
  'delivered',
  'failed'
);

create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (
    display_name is null
    or char_length(trim(display_name)) between 2 and 120
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  code text not null check (
    char_length(code) between 2 and 32
    and code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  timezone text not null default 'Africa/Lagos' check (
    char_length(timezone) between 3 and 64
    and timezone !~ '[[:cntrl:]]'
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, code)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  code text not null check (
    char_length(code) between 2 and 32
    and code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, code)
);

-- This composite key lets child tables prove a membership belongs to the
-- supplied organization without trusting application-side filtering.
alter table public.memberships
  add constraint memberships_organization_id_id_key
  unique (organization_id, id);

create table public.location_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null,
  membership_id uuid not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, membership_id, location_id),
  foreign key (organization_id, location_id)
    references public.locations(organization_id, id) on delete cascade,
  foreign key (organization_id, membership_id)
    references public.memberships(organization_id, id) on delete cascade
);

create table public.onboarding_checklists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  step public.onboarding_step not null,
  status public.onboarding_step_status not null default 'not_started',
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id, step),
  foreign key (organization_id, user_id)
    references public.memberships(organization_id, user_id) on delete cascade,
  check (
    (status = 'completed' and completed_at is not null and completed_by is not null)
    or (status <> 'completed' and completed_at is null and completed_by is null)
  )
);

create table public.event_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid,
  scope public.event_scope not null,
  event_type text not null check (
    char_length(event_type) between 3 and 120
    and event_type ~ '^[a-z0-9]+([._-][a-z0-9]+)+$'
  ),
  aggregate_type text not null check (
    char_length(aggregate_type) between 2 and 80
    and aggregate_type ~ '^[a-z0-9_]+$'
  ),
  aggregate_id uuid,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text check (
    idempotency_key is null
    or char_length(idempotency_key) between 8 and 160
  ),
  delivery_status public.event_delivery_status not null default 'pending',
  delivery_attempts integer not null default 0 check (delivery_attempts between 0 and 100),
  available_at timestamptz not null default timezone('utc', now()),
  delivered_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (organization_id, location_id)
    references public.locations(organization_id, id) on delete restrict,
  unique (organization_id, idempotency_key),
  check (
    (scope = 'organization' and location_id is null)
    or (scope = 'location' and location_id is not null)
  ),
  check (
    (delivery_status = 'delivered' and delivered_at is not null)
    or (delivery_status <> 'delivered' and delivered_at is null)
  )
);

create index locations_organization_name_idx
  on public.locations (organization_id, name);

create index brands_organization_name_idx
  on public.brands (organization_id, name);

create index location_assignments_membership_idx
  on public.location_assignments (organization_id, membership_id);

create index location_assignments_location_idx
  on public.location_assignments (organization_id, location_id);

create index onboarding_checklists_user_idx
  on public.onboarding_checklists (user_id, organization_id, status);

create index event_log_delivery_idx
  on public.event_log (delivery_status, available_at, created_at)
  where delivery_status in ('pending', 'failed');

create index event_log_organization_created_idx
  on public.event_log (organization_id, created_at desc);

create trigger app_users_set_updated_at
before update on public.app_users
for each row execute function private.set_updated_at();

create trigger locations_set_updated_at
before update on public.locations
for each row execute function private.set_updated_at();

create trigger brands_set_updated_at
before update on public.brands
for each row execute function private.set_updated_at();

create trigger onboarding_checklists_set_updated_at
before update on public.onboarding_checklists
for each row execute function private.set_updated_at();

create function private.role_has_permission(
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
      'organization.view',
      'organization.manage',
      'members.view',
      'members.manage',
      'audit.view',
      'location.view',
      'location.manage',
      'brand.view',
      'brand.manage',
      'onboarding.view',
      'onboarding.manage',
      'event.view'
    ])
    when 'executive' then required_permission = any (array[
      'organization.view',
      'members.view',
      'audit.view',
      'location.view',
      'brand.view',
      'onboarding.view',
      'event.view'
    ])
    when 'merchandising_manager' then required_permission = any (array[
      'organization.view',
      'location.view',
      'brand.view',
      'brand.manage'
    ])
    when 'store_manager' then required_permission = any (array[
      'organization.view',
      'location.view',
      'brand.view'
    ])
    when 'viewer' then required_permission = any (array[
      'organization.view',
      'location.view',
      'brand.view'
    ])
    else false
  end;
$$;

create or replace function private.has_permission(
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
      and private.role_has_permission(membership.role, required_permission)
  );
$$;

create function private.has_location_permission(
  target_organization_id uuid,
  target_location_id uuid,
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
      and private.role_has_permission(membership.role, required_permission)
      and (
        membership.role in ('org_owner', 'executive', 'merchandising_manager')
        or exists (
          select 1
          from public.location_assignments as assignment
          where assignment.organization_id = target_organization_id
            and assignment.location_id = target_location_id
            and assignment.membership_id = membership.id
        )
      )
  );
$$;

create function private.create_app_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_users (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_create_app_user
after insert on auth.users
for each row execute function private.create_app_user();

insert into public.app_users (id)
select id from auth.users
on conflict (id) do nothing;

create function private.seed_owner_onboarding_checklist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'org_owner' and new.status = 'active' then
    insert into public.onboarding_checklists (
      organization_id,
      user_id,
      step
    )
    select
      new.organization_id,
      new.user_id,
      checklist_step
    from unnest(enum_range(null::public.onboarding_step)) as checklist_step
    on conflict (organization_id, user_id, step) do nothing;
  end if;
  return new;
end;
$$;

create trigger memberships_seed_owner_onboarding
after insert or update of role, status on public.memberships
for each row execute function private.seed_owner_onboarding_checklist();

insert into public.onboarding_checklists (organization_id, user_id, step)
select membership.organization_id, membership.user_id, checklist_step
from public.memberships as membership
cross join unnest(enum_range(null::public.onboarding_step)) as checklist_step
where membership.role = 'org_owner'
  and membership.status = 'active'
on conflict (organization_id, user_id, step) do nothing;

create function private.audit_phase0_foundation_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_row record;
  action_name text;
  target_location_id uuid;
begin
  if tg_op = 'DELETE' then
    changed_row := old;
  else
    changed_row := new;
  end if;

  action_name := lower(tg_table_name || '.' || tg_op);

  if tg_table_name = 'locations' then
    target_location_id := changed_row.id;
  elsif tg_table_name = 'location_assignments' then
    target_location_id := changed_row.location_id;
  else
    target_location_id := null;
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
    action_name,
    tg_table_name,
    changed_row.id,
    jsonb_build_object('operation', lower(tg_op))
  );

  insert into public.event_log (
    organization_id,
    location_id,
    scope,
    event_type,
    aggregate_type,
    aggregate_id,
    payload
  )
  values (
    changed_row.organization_id,
    target_location_id,
    case when tg_table_name in ('locations', 'location_assignments')
      then 'location'::public.event_scope
      else 'organization'::public.event_scope
    end,
    'foundation.' || lower(tg_table_name) || '.' || lower(tg_op),
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

create trigger locations_audit_change
after insert or update on public.locations
for each row execute function private.audit_phase0_foundation_change();

create trigger brands_audit_change
after insert or update on public.brands
for each row execute function private.audit_phase0_foundation_change();

create trigger location_assignments_audit_change
after insert or delete on public.location_assignments
for each row execute function private.audit_phase0_foundation_change();

create function private.set_onboarding_step_impl(
  target_organization_id uuid,
  target_step public.onboarding_step,
  target_status public.onboarding_step_status
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  checklist_id uuid;
begin
  if caller_id is null or auth.role() <> 'authenticated' then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if not private.has_permission(target_organization_id, 'onboarding.manage') then
    raise exception using errcode = '42501', message = 'permission_denied';
  end if;

  update public.onboarding_checklists
  set
    status = target_status,
    completed_at = case when target_status = 'completed'
      then timezone('utc', now())
      else null
    end,
    completed_by = case when target_status = 'completed'
      then caller_id
      else null
    end
  where organization_id = target_organization_id
    and user_id = caller_id
    and step = target_step
  returning id into checklist_id;

  if checklist_id is null then
    raise exception using errcode = 'P0002', message = 'onboarding_step_not_found';
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
    target_organization_id,
    caller_id,
    'onboarding.step_status_changed',
    'onboarding_checklist',
    checklist_id,
    jsonb_build_object('step', target_step, 'status', target_status)
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
    target_organization_id,
    'organization',
    'onboarding.step-status-changed',
    'onboarding_checklist',
    checklist_id,
    jsonb_build_object('step', target_step, 'status', target_status)
  );
end;
$$;

create function public.set_onboarding_step(
  target_organization_id uuid,
  target_step public.onboarding_step,
  target_status public.onboarding_step_status
)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.set_onboarding_step_impl(
    target_organization_id,
    target_step,
    target_status
  );
$$;

alter table public.app_users enable row level security;
alter table public.app_users force row level security;
alter table public.locations enable row level security;
alter table public.locations force row level security;
alter table public.brands enable row level security;
alter table public.brands force row level security;
alter table public.location_assignments enable row level security;
alter table public.location_assignments force row level security;
alter table public.onboarding_checklists enable row level security;
alter table public.onboarding_checklists force row level security;
alter table public.event_log enable row level security;
alter table public.event_log force row level security;

create policy app_users_select_self
on public.app_users
for select
to authenticated
using (id = (select auth.uid()));

create policy app_users_update_self
on public.app_users
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy locations_select
on public.locations
for select
to authenticated
using (private.has_location_permission(organization_id, id, 'location.view'));

create policy locations_insert
on public.locations
for insert
to authenticated
with check (
  private.has_permission(organization_id, 'location.manage')
  and created_by = (select auth.uid())
);

create policy locations_update
on public.locations
for update
to authenticated
using (private.has_permission(organization_id, 'location.manage'))
with check (private.has_permission(organization_id, 'location.manage'));

create policy brands_select
on public.brands
for select
to authenticated
using (private.has_permission(organization_id, 'brand.view'));

create policy brands_insert
on public.brands
for insert
to authenticated
with check (
  private.has_permission(organization_id, 'brand.manage')
  and created_by = (select auth.uid())
);

create policy brands_update
on public.brands
for update
to authenticated
using (private.has_permission(organization_id, 'brand.manage'))
with check (private.has_permission(organization_id, 'brand.manage'));

create policy location_assignments_select
on public.location_assignments
for select
to authenticated
using (
  private.has_permission(organization_id, 'members.view')
  or exists (
    select 1
    from public.memberships as membership
    where membership.id = membership_id
      and membership.organization_id = organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  )
);

create policy location_assignments_insert
on public.location_assignments
for insert
to authenticated
with check (
  private.has_permission(organization_id, 'members.manage')
  and created_by = (select auth.uid())
);

create policy location_assignments_delete
on public.location_assignments
for delete
to authenticated
using (private.has_permission(organization_id, 'members.manage'));

create policy onboarding_checklists_select
on public.onboarding_checklists
for select
to authenticated
using (
  (
    user_id = (select auth.uid())
    and private.has_permission(organization_id, 'organization.view')
  )
  or private.has_permission(organization_id, 'onboarding.view')
);

create policy event_log_select
on public.event_log
for select
to authenticated
using (
  private.has_permission(organization_id, 'event.view')
  and (
    scope = 'organization'
    or private.has_location_permission(organization_id, location_id, 'location.view')
  )
);

revoke all on table public.app_users from anon, authenticated;
revoke all on table public.locations from anon, authenticated;
revoke all on table public.brands from anon, authenticated;
revoke all on table public.location_assignments from anon, authenticated;
revoke all on table public.onboarding_checklists from anon, authenticated;
revoke all on table public.event_log from anon, authenticated;

grant select on table public.app_users to authenticated;
grant update (display_name, updated_at) on table public.app_users to authenticated;

grant select on table public.locations to authenticated;
grant insert (organization_id, name, code, timezone, created_by)
  on table public.locations to authenticated;
grant update (name, code, timezone, updated_at)
  on table public.locations to authenticated;

grant select on table public.brands to authenticated;
grant insert (organization_id, name, code, created_by)
  on table public.brands to authenticated;
grant update (name, code, updated_at)
  on table public.brands to authenticated;

grant select on table public.location_assignments to authenticated;
grant insert (organization_id, location_id, membership_id, created_by)
  on table public.location_assignments to authenticated;
grant delete on table public.location_assignments to authenticated;

grant select on table public.onboarding_checklists to authenticated;
grant select on table public.event_log to authenticated;

revoke all on function private.role_has_permission(public.organization_role, text) from public;
revoke all on function private.has_location_permission(uuid, uuid, text) from public;
revoke all on function private.create_app_user() from public;
revoke all on function private.seed_owner_onboarding_checklist() from public;
revoke all on function private.audit_phase0_foundation_change() from public;
revoke all on function private.set_onboarding_step_impl(uuid, public.onboarding_step, public.onboarding_step_status) from public;
revoke all on function public.set_onboarding_step(uuid, public.onboarding_step, public.onboarding_step_status) from public;

grant execute on function private.has_location_permission(uuid, uuid, text) to authenticated;
grant execute on function private.set_onboarding_step_impl(uuid, public.onboarding_step, public.onboarding_step_status) to authenticated;
grant execute on function public.set_onboarding_step(uuid, public.onboarding_step, public.onboarding_step_status) to authenticated;

comment on table public.app_users is
  'Tenant-neutral application profile keyed one-to-one to auth.users; never an authorization authority.';

comment on table public.event_log is
  'Append-only operational outbox. It is not a substitute for immutable security audit evidence.';

comment on function public.set_onboarding_step(uuid, public.onboarding_step, public.onboarding_step_status) is
  'Permission-checked owner onboarding transition that records audit and operational events atomically.';

commit;
