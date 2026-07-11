begin;

-- Phase 0 Milestone 5: recovery proposals become permissioned internal
-- projects. Nothing here changes price, stock, publishing, or customer contact.

create table public.recovery_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recovery_opportunity_id uuid not null,
  location_id uuid not null,
  name text not null check (char_length(name) between 3 and 180),
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'in_progress', 'completed', 'cancelled')),
  version integer not null default 1 check (version > 0),
  evidence_version text not null check (char_length(evidence_version) between 8 and 160),
  evidence_snapshot jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, recovery_opportunity_id),
  foreign key (organization_id, recovery_opportunity_id) references public.recovery_opportunities(organization_id, id) on delete restrict,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict,
  check (
    (status = 'pending_approval' and submitted_by is not null and submitted_at is not null)
    or status <> 'pending_approval'
  ),
  check (
    (status in ('approved', 'in_progress', 'completed') and approved_by is not null and approved_at is not null)
    or status not in ('approved', 'in_progress', 'completed')
  ),
  check ((status = 'completed' and completed_at is not null) or status <> 'completed')
);

create table public.recovery_project_skus (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recovery_project_id uuid not null,
  inventory_position_id uuid not null,
  sku_id uuid not null,
  location_id uuid not null,
  quantity integer not null check (quantity >= 0),
  approved_unit_cost numeric(18, 4) check (approved_unit_cost is null or approved_unit_cost >= 0),
  currency_code text check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  evidence jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, recovery_project_id, inventory_position_id),
  foreign key (organization_id, recovery_project_id) references public.recovery_projects(organization_id, id) on delete cascade,
  foreign key (organization_id, inventory_position_id) references public.inventory_positions(organization_id, id) on delete restrict,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create table public.recovery_project_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recovery_project_id uuid not null,
  location_id uuid not null,
  title text not null check (char_length(title) between 3 and 180),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  version integer not null default 1 check (version > 0),
  assigned_membership_id uuid,
  evidence jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, recovery_project_id) references public.recovery_projects(organization_id, id) on delete cascade,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict,
  foreign key (organization_id, assigned_membership_id) references public.memberships(organization_id, id) on delete set null,
  check ((status = 'completed' and completed_by is not null and completed_at is not null) or status <> 'completed')
);

create table public.campaign_briefs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recovery_project_id uuid not null,
  location_id uuid not null,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved')),
  version integer not null default 1 check (version > 0),
  content jsonb not null,
  evidence_version text not null,
  evidence_snapshot jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, recovery_project_id),
  foreign key (organization_id, recovery_project_id) references public.recovery_projects(organization_id, id) on delete cascade,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict,
  check ((status = 'approved' and approved_by is not null and approved_at is not null) or status <> 'approved')
);

create table public.approval_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recovery_project_id uuid not null,
  campaign_brief_id uuid,
  location_id uuid not null,
  subject_type text not null check (subject_type in ('recovery_project', 'campaign_brief')),
  subject_version integer not null check (subject_version > 0),
  evidence_version text not null,
  decision text not null check (decision = 'approved'),
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique nulls not distinct (organization_id, subject_type, recovery_project_id, campaign_brief_id, subject_version),
  foreign key (organization_id, recovery_project_id) references public.recovery_projects(organization_id, id) on delete restrict,
  foreign key (organization_id, campaign_brief_id) references public.campaign_briefs(organization_id, id) on delete restrict,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict,
  check (
    (subject_type = 'recovery_project' and campaign_brief_id is null)
    or (subject_type = 'campaign_brief' and campaign_brief_id is not null)
  )
);

create index recovery_projects_status_idx on public.recovery_projects (organization_id, status, created_at desc);
create index recovery_project_tasks_status_idx on public.recovery_project_tasks (organization_id, location_id, status);
create index approval_records_project_idx on public.approval_records (organization_id, recovery_project_id, decided_at desc);

create trigger recovery_projects_set_updated_at before update on public.recovery_projects for each row execute function private.set_updated_at();
create trigger recovery_project_tasks_set_updated_at before update on public.recovery_project_tasks for each row execute function private.set_updated_at();
create trigger campaign_briefs_set_updated_at before update on public.campaign_briefs for each row execute function private.set_updated_at();

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
      'campaign_brief.view','campaign_brief.manage','campaign_brief.approve'
    ])
    when 'executive' then required_permission = any (array[
      'organization.view','members.view','audit.view','location.view','brand.view','onboarding.view','event.view',
      'data.view','inventory.view','opportunity.view','project.view','project.approve',
      'task.view','campaign_brief.view','campaign_brief.approve'
    ])
    when 'merchandising_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','brand.manage','data.view','data.manage',
      'inventory.view','intelligence.run','opportunity.view','project.view','project.manage',
      'task.view','task.manage','campaign_brief.view','campaign_brief.manage'
    ])
    when 'store_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','inventory.view','opportunity.view',
      'project.view','task.view','task.manage','campaign_brief.view'
    ])
    when 'viewer' then required_permission = any (array[
      'organization.view','location.view','brand.view','data.view','inventory.view','opportunity.view',
      'project.view','task.view','campaign_brief.view'
    ])
    else false
  end;
$$;

alter table public.recovery_projects enable row level security;
alter table public.recovery_projects force row level security;
alter table public.recovery_project_skus enable row level security;
alter table public.recovery_project_skus force row level security;
alter table public.recovery_project_tasks enable row level security;
alter table public.recovery_project_tasks force row level security;
alter table public.campaign_briefs enable row level security;
alter table public.campaign_briefs force row level security;
alter table public.approval_records enable row level security;
alter table public.approval_records force row level security;

create policy recovery_projects_select on public.recovery_projects
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'project.view'));
create policy recovery_project_skus_select on public.recovery_project_skus
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'project.view'));
create policy recovery_project_tasks_select on public.recovery_project_tasks
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'task.view'));
create policy campaign_briefs_select on public.campaign_briefs
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'campaign_brief.view'));
create policy approval_records_select on public.approval_records
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'project.view'));

revoke all on table public.recovery_projects from anon, authenticated;
revoke all on table public.recovery_project_skus from anon, authenticated;
revoke all on table public.recovery_project_tasks from anon, authenticated;
revoke all on table public.campaign_briefs from anon, authenticated;
revoke all on table public.approval_records from anon, authenticated;
grant select on table public.recovery_projects to authenticated;
grant select on table public.recovery_project_skus to authenticated;
grant select on table public.recovery_project_tasks to authenticated;
grant select on table public.campaign_briefs to authenticated;
grant select on table public.approval_records to authenticated;

create or replace function public.create_recovery_project(
  target_opportunity_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_organization_id uuid;
  target_location_id uuid;
  opportunity record;
  insight record;
  position record;
  existing_project_id uuid;
  project_id uuid := gen_random_uuid();
  brief_id uuid := gen_random_uuid();
  evidence_version text;
begin
  if actor_id is null then raise exception 'authentication_required'; end if;

  select * into opportunity
  from public.recovery_opportunities
  where id = target_opportunity_id
  for update;
  target_organization_id := opportunity.organization_id;
  target_location_id := opportunity.location_id;
  if target_organization_id is null
    or not private.has_location_permission(target_organization_id, target_location_id, 'project.manage') then
    raise exception 'permission_denied';
  end if;

  select id into existing_project_id
  from public.recovery_projects
  where organization_id = target_organization_id
    and recovery_opportunity_id = target_opportunity_id;
  if existing_project_id is not null then return existing_project_id; end if;
  if opportunity.status <> 'open' then raise exception 'opportunity_not_open'; end if;

  select * into insight
  from public.inventory_risk_insights
  where organization_id = target_organization_id
    and id = opportunity.inventory_risk_insight_id;
  select * into position
  from public.inventory_positions
  where organization_id = target_organization_id
    and id = insight.inventory_position_id;
  if position.id is null then raise exception 'evidence_not_found'; end if;

  evidence_version := insight.rule_version || ':' || insight.intelligence_run_id::text;
  insert into public.recovery_projects (
    id, organization_id, recovery_opportunity_id, location_id, name,
    evidence_version, evidence_snapshot, created_by
  ) values (
    project_id, target_organization_id, target_opportunity_id, target_location_id,
    opportunity.title, evidence_version,
    jsonb_build_object(
      'recovery_opportunity_id', opportunity.id,
      'inventory_risk_insight_id', insight.id,
      'inventory_position_id', position.id,
      'opportunity_score', opportunity.recovery_opportunity_score,
      'attention_score', opportunity.attention_priority_score,
      'rule_version', insight.rule_version
    ),
    actor_id
  );

  insert into public.recovery_project_skus (
    organization_id, recovery_project_id, inventory_position_id, sku_id,
    location_id, quantity, approved_unit_cost, currency_code, evidence
  ) values (
    target_organization_id, project_id, position.id, position.sku_id,
    target_location_id, position.on_hand_quantity, position.approved_unit_cost,
    position.currency_code,
    jsonb_build_object('inventory_position_id', position.id, 'intelligence_run_id', insight.intelligence_run_id)
  );

  insert into public.recovery_project_tasks (
    organization_id, recovery_project_id, location_id, title, evidence, created_by
  ) values
    (target_organization_id, project_id, target_location_id, 'Review source evidence and caveats', jsonb_build_object('project_id', project_id), actor_id),
    (target_organization_id, project_id, target_location_id, 'Prepare internal recovery action plan', jsonb_build_object('project_id', project_id), actor_id),
    (target_organization_id, project_id, target_location_id, 'Record execution decision and outcome', jsonb_build_object('project_id', project_id), actor_id);

  insert into public.campaign_briefs (
    id, organization_id, recovery_project_id, location_id, content,
    evidence_version, evidence_snapshot, created_by
  ) values (
    brief_id, target_organization_id, project_id, target_location_id,
    jsonb_build_object(
      'objective', 'Prepare an internal recovery campaign proposal for ' || opportunity.title || '.',
      'audience', 'Existing customers relevant to the selected product story; segment selection remains a human decision.',
      'proposition', opportunity.title,
      'product_focus', jsonb_build_array(position.sku_id),
      'value_context', case
        when position.approved_unit_cost is not null and position.currency_code is not null
          then (position.on_hand_quantity * position.approved_unit_cost)::text || ' ' || position.currency_code || ' of approved-cost inventory is in scope.'
        else 'Recoverable value is unavailable until approved cost and currency evidence are complete.'
      end,
      'constraints', jsonb_build_array(
        'Proposal only: no pricing, inventory, publishing, or customer-contact action is executed.',
        'A permitted approver must review current evidence before execution outside RetailOS.',
        'Phase 0 does not predict campaign outcomes.'
      ),
      'rule_version', insight.rule_version
    ),
    evidence_version,
    jsonb_build_object('project_id', project_id, 'opportunity_id', opportunity.id, 'insight_id', insight.id),
    actor_id
  );

  update public.recovery_opportunities
  set status = 'projectised'
  where organization_id = target_organization_id and id = target_opportunity_id;
  update public.action_cards
  set status = 'projectised'
  where organization_id = target_organization_id and recovery_opportunity_id = target_opportunity_id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id, actor_id, 'recovery_project.created',
    'recovery_project', project_id,
    jsonb_build_object('opportunity_id', target_opportunity_id, 'evidence_version', evidence_version)
  );
  return project_id;
end;
$$;

create or replace function public.submit_recovery_project(
  target_project_id uuid,
  expected_version integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  project record;
begin
  if actor_id is null then raise exception 'authentication_required'; end if;
  select * into project from public.recovery_projects where id = target_project_id for update;
  if project.organization_id is null
    or not private.has_location_permission(project.organization_id, project.location_id, 'project.manage') then
    raise exception 'permission_denied';
  end if;
  if project.version <> expected_version then raise exception 'stale_project_version'; end if;
  if project.status <> 'draft' then raise exception 'invalid_project_transition'; end if;

  update public.recovery_projects
  set status = 'pending_approval', version = version + 1,
      submitted_by = actor_id, submitted_at = timezone('utc', now())
  where organization_id = project.organization_id and id = target_project_id;
  update public.campaign_briefs
  set status = 'pending_approval', version = version + 1
  where organization_id = project.organization_id and recovery_project_id = target_project_id;
  return expected_version + 1;
end;
$$;

create or replace function public.approve_recovery_project(
  target_project_id uuid,
  expected_version integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  project record;
begin
  if actor_id is null then raise exception 'authentication_required'; end if;
  select * into project from public.recovery_projects where id = target_project_id for update;
  if project.organization_id is null
    or not private.has_location_permission(project.organization_id, project.location_id, 'project.approve') then
    raise exception 'permission_denied';
  end if;
  if project.created_by = actor_id then raise exception 'self_approval_denied'; end if;
  if project.version <> expected_version then raise exception 'stale_project_version'; end if;
  if project.status <> 'pending_approval' then raise exception 'invalid_project_transition'; end if;

  insert into public.approval_records (
    organization_id, recovery_project_id, location_id, subject_type,
    subject_version, evidence_version, decision, decided_by
  ) values (
    project.organization_id, target_project_id, project.location_id,
    'recovery_project', project.version, project.evidence_version, 'approved', actor_id
  );
  update public.recovery_projects
  set status = 'approved', version = version + 1,
      approved_by = actor_id, approved_at = timezone('utc', now())
  where organization_id = project.organization_id and id = target_project_id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    project.organization_id, actor_id, 'recovery_project.approved',
    'recovery_project', target_project_id,
    jsonb_build_object('subject_version', project.version, 'evidence_version', project.evidence_version)
  );
  return expected_version + 1;
end;
$$;

create or replace function public.approve_campaign_brief(
  target_brief_id uuid,
  expected_version integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  brief record;
  project record;
begin
  if actor_id is null then raise exception 'authentication_required'; end if;
  select * into brief from public.campaign_briefs where id = target_brief_id for update;
  if brief.organization_id is null
    or not private.has_location_permission(brief.organization_id, brief.location_id, 'campaign_brief.approve') then
    raise exception 'permission_denied';
  end if;
  if brief.created_by = actor_id then raise exception 'self_approval_denied'; end if;
  if brief.version <> expected_version then raise exception 'stale_brief_version'; end if;
  if brief.status <> 'pending_approval' then raise exception 'invalid_brief_transition'; end if;
  select * into project from public.recovery_projects
  where organization_id = brief.organization_id and id = brief.recovery_project_id;
  if project.status <> 'approved' then raise exception 'project_approval_required'; end if;

  insert into public.approval_records (
    organization_id, recovery_project_id, campaign_brief_id, location_id,
    subject_type, subject_version, evidence_version, decision, decided_by
  ) values (
    brief.organization_id, brief.recovery_project_id, brief.id, brief.location_id,
    'campaign_brief', brief.version, brief.evidence_version, 'approved', actor_id
  );
  update public.campaign_briefs
  set status = 'approved', version = version + 1,
      approved_by = actor_id, approved_at = timezone('utc', now())
  where organization_id = brief.organization_id and id = target_brief_id;
  return expected_version + 1;
end;
$$;

create or replace function public.set_recovery_task_status(
  target_task_id uuid,
  expected_version integer,
  target_status text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  task record;
  project record;
begin
  if actor_id is null then raise exception 'authentication_required'; end if;
  if target_status not in ('in_progress', 'completed') then raise exception 'invalid_task_status'; end if;
  select * into task from public.recovery_project_tasks where id = target_task_id for update;
  if task.organization_id is null
    or not private.has_location_permission(task.organization_id, task.location_id, 'task.manage') then
    raise exception 'permission_denied';
  end if;
  if task.version <> expected_version then raise exception 'stale_task_version'; end if;
  if not (
    (task.status = 'pending' and target_status = 'in_progress')
    or (task.status = 'in_progress' and target_status = 'completed')
  ) then raise exception 'invalid_task_transition'; end if;
  select * into project from public.recovery_projects
  where organization_id = task.organization_id and id = task.recovery_project_id
  for update;
  if project.status not in ('approved', 'in_progress') then raise exception 'project_not_executable'; end if;

  update public.recovery_project_tasks
  set status = target_status, version = version + 1,
      completed_by = case when target_status = 'completed' then actor_id else null end,
      completed_at = case when target_status = 'completed' then timezone('utc', now()) else null end
  where organization_id = task.organization_id and id = target_task_id;

  if target_status = 'in_progress' and project.status = 'approved' then
    update public.recovery_projects
    set status = 'in_progress', version = version + 1
    where organization_id = project.organization_id and id = project.id;
  elsif target_status = 'completed' and not exists (
    select 1 from public.recovery_project_tasks
    where organization_id = task.organization_id
      and recovery_project_id = task.recovery_project_id
      and id <> target_task_id
      and status <> 'completed'
  ) then
    update public.recovery_projects
    set status = 'completed', version = version + 1,
        completed_at = timezone('utc', now())
    where organization_id = project.organization_id and id = project.id;
  end if;
  return expected_version + 1;
end;
$$;

revoke all on function public.create_recovery_project(uuid) from public, anon;
revoke all on function public.submit_recovery_project(uuid, integer) from public, anon;
revoke all on function public.approve_recovery_project(uuid, integer) from public, anon;
revoke all on function public.approve_campaign_brief(uuid, integer) from public, anon;
revoke all on function public.set_recovery_task_status(uuid, integer, text) from public, anon;
grant execute on function public.create_recovery_project(uuid) to authenticated;
grant execute on function public.submit_recovery_project(uuid, integer) to authenticated;
grant execute on function public.approve_recovery_project(uuid, integer) to authenticated;
grant execute on function public.approve_campaign_brief(uuid, integer) to authenticated;
grant execute on function public.set_recovery_task_status(uuid, integer, text) to authenticated;

commit;
