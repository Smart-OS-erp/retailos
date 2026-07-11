begin;

-- Phase 0 Milestone 6: deterministic, permission-scoped explanations only.
-- No LLM, arbitrary tool execution, or high-impact action is present.

create table public.copilot_activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_category text not null check (char_length(question_category) between 3 and 80),
  subject_id uuid,
  response_status text not null check (response_status in ('answered', 'insufficient_evidence', 'refused')),
  response_summary text not null check (char_length(response_summary) between 3 and 1000),
  citations jsonb not null default '[]'::jsonb,
  rule_version text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id)
);

create index copilot_activity_user_idx
  on public.copilot_activity_log (user_id, organization_id, created_at desc);

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
      'campaign_brief.view','campaign_brief.manage','campaign_brief.approve','copilot.use'
    ])
    when 'executive' then required_permission = any (array[
      'organization.view','members.view','audit.view','location.view','brand.view','onboarding.view','event.view',
      'data.view','inventory.view','opportunity.view','project.view','project.approve',
      'task.view','campaign_brief.view','campaign_brief.approve','copilot.use'
    ])
    when 'merchandising_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','brand.manage','data.view','data.manage',
      'inventory.view','intelligence.run','opportunity.view','project.view','project.manage',
      'task.view','task.manage','campaign_brief.view','campaign_brief.manage','copilot.use'
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

alter table public.copilot_activity_log enable row level security;
alter table public.copilot_activity_log force row level security;
create policy copilot_activity_log_select on public.copilot_activity_log
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and private.has_permission(organization_id, 'copilot.use')
  );
revoke all on table public.copilot_activity_log from anon, authenticated;
grant select on table public.copilot_activity_log to authenticated;

create or replace function public.get_retail_copilot_answer(
  question_category text,
  target_subject_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_organization_id uuid;
  membership_count integer;
  active_rule_version constant text := 'retailos.phase0.inventory-recovery.v1';
  answer jsonb;
  citations jsonb := '[]'::jsonb;
  response_status text;
  response_summary text;
  subject_location_id uuid;
  subject record;
  totals_by_currency jsonb;
begin
  if actor_id is null then raise exception 'authentication_required'; end if;

  select count(*)
  into membership_count
  from public.memberships
  where user_id = actor_id and status = 'active';
  if membership_count <> 1 then
    raise exception 'permission_denied';
  end if;
  select organization_id
  into target_organization_id
  from public.memberships
  where user_id = actor_id and status = 'active'
  limit 1;
  if not private.has_permission(target_organization_id, 'copilot.use') then
    raise exception 'permission_denied';
  end if;

  if question_category is null
    or question_category not in ('morning_brief', 'inventory_risk', 'opportunity', 'project') then
    response_status := 'refused';
    response_summary := 'Retail Copilot only answers approved Phase 0 evidence questions and cannot override permissions or execute actions.';
    answer := jsonb_build_object(
      'status', response_status,
      'heading', 'Question refused',
      'summary', response_summary,
      'citations', citations,
      'proposed_next_step', null,
      'executes_actions', false,
      'rule_version', active_rule_version
    );
  elsif question_category = 'morning_brief' then
    select coalesce(jsonb_object_agg(currency_code, total_value), '{}'::jsonb)
    into totals_by_currency
    from (
      select opportunity.currency_code, round(sum(opportunity.estimated_value), 4) as total_value
      from public.recovery_opportunities opportunity
      where opportunity.organization_id = target_organization_id
        and opportunity.status = 'open'
        and private.has_location_permission(
          opportunity.organization_id,
          opportunity.location_id,
          'opportunity.view'
        )
      group by opportunity.currency_code
    ) totals;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'source_type', 'recovery_opportunity',
          'record_id', opportunity.id,
          'observed_at', opportunity.created_at
        )
        order by opportunity.attention_priority_score desc
      ),
      '[]'::jsonb
    )
    into citations
    from (
      select *
      from public.recovery_opportunities
      where organization_id = target_organization_id
        and status = 'open'
        and private.has_location_permission(organization_id, location_id, 'opportunity.view')
      order by attention_priority_score desc
      limit 5
    ) opportunity;

    response_status := case when jsonb_array_length(citations) = 0 then 'insufficient_evidence' else 'answered' end;
    response_summary := case
      when response_status = 'answered'
        then 'RetailOS found permission-visible recovery opportunities in the latest persisted intelligence.'
      else 'No permission-visible recovery opportunity is supported by current approved evidence.'
    end;
    answer := jsonb_build_object(
      'status', response_status,
      'heading', 'Morning Brief',
      'summary', response_summary,
      'facts', jsonb_build_object(
        'open_opportunities', jsonb_array_length(citations),
        'totals_by_currency', totals_by_currency,
        'open_tasks', (
          select count(*)
          from public.recovery_project_tasks task
          where task.organization_id = target_organization_id
            and task.status <> 'completed'
            and private.has_location_permission(task.organization_id, task.location_id, 'task.view')
        )
      ),
      'citations', citations,
      'proposed_next_step', 'Review the highest-ranked permission-visible evidence.',
      'executes_actions', false,
      'rule_version', active_rule_version
    );
  elsif question_category = 'inventory_risk' then
    select * into subject
    from public.inventory_risk_insights
    where organization_id = target_organization_id and id = target_subject_id;
    if not found then
      response_status := 'refused';
      response_summary := 'The requested risk evidence is unavailable within your effective permissions.';
      answer := jsonb_build_object(
        'status', response_status, 'heading', 'Risk explanation refused',
        'summary', response_summary, 'citations', citations,
        'proposed_next_step', null, 'executes_actions', false,
        'rule_version', active_rule_version
      );
    else
      subject_location_id := subject.location_id;
      if not private.has_location_permission(target_organization_id, subject_location_id, 'opportunity.view') then
      response_status := 'refused';
      response_summary := 'The requested risk evidence is unavailable within your effective permissions.';
      answer := jsonb_build_object(
        'status', response_status, 'heading', 'Risk explanation refused',
        'summary', response_summary, 'citations', citations,
        'proposed_next_step', null, 'executes_actions', false,
        'rule_version', active_rule_version
      );
    else
      citations := jsonb_build_array(
        jsonb_build_object('source_type', 'inventory_risk_insight', 'record_id', subject.id, 'observed_at', subject.evaluated_at),
        jsonb_build_object('source_type', 'inventory_position', 'record_id', subject.inventory_position_id, 'observed_at', subject.evaluated_at)
      );
      response_status := case when subject.inventory_risk_status = 'known' then 'answered' else 'insufficient_evidence' end;
      response_summary := case
        when subject.inventory_risk_status = 'known'
          then 'Inventory risk is ' || subject.inventory_risk_score::text || '/100 (' || subject.inventory_risk_band || ') with ' || subject.data_confidence_score::text || '% confidence.'
        else 'Risk is not scored because required evidence is unknown or suppressed: ' || coalesce(subject.suppression_reason, 'missing evidence') || '.'
      end;
      answer := jsonb_build_object(
        'status', response_status, 'heading', 'Inventory risk explanation',
        'summary', response_summary, 'facts', subject.evidence,
        'citations', citations,
        'proposed_next_step', 'Review the source position and confidence caveats.',
        'executes_actions', false, 'rule_version', subject.rule_version
      );
      end if;
    end if;
  elsif question_category = 'opportunity' then
    select * into subject
    from public.recovery_opportunities
    where organization_id = target_organization_id and id = target_subject_id;
    if not found then
      response_status := 'refused';
      response_summary := 'The requested opportunity is unavailable within your effective permissions.';
      answer := jsonb_build_object(
        'status', response_status, 'heading', 'Opportunity explanation refused',
        'summary', response_summary, 'citations', citations,
        'proposed_next_step', null, 'executes_actions', false,
        'rule_version', active_rule_version
      );
    else
      subject_location_id := subject.location_id;
      if not private.has_location_permission(target_organization_id, subject_location_id, 'opportunity.view') then
      response_status := 'refused';
      response_summary := 'The requested opportunity is unavailable within your effective permissions.';
      answer := jsonb_build_object(
        'status', response_status, 'heading', 'Opportunity explanation refused',
        'summary', response_summary, 'citations', citations,
        'proposed_next_step', null, 'executes_actions', false,
        'rule_version', active_rule_version
      );
    else
      citations := jsonb_build_array(
        jsonb_build_object('source_type', 'recovery_opportunity', 'record_id', subject.id, 'observed_at', subject.created_at),
        jsonb_build_object('source_type', 'inventory_risk_insight', 'record_id', subject.inventory_risk_insight_id, 'observed_at', subject.created_at)
      );
      response_status := 'answered';
      response_summary := subject.title || ': ' || subject.recovery_opportunity_score::text || '/100 opportunity, ' || subject.attention_priority_band || ' attention.';
      answer := jsonb_build_object(
        'status', response_status, 'heading', 'Recovery opportunity explanation',
        'summary', response_summary,
        'facts', jsonb_build_object(
          'proposal', subject.proposed_action,
          'estimated_value', subject.estimated_value,
          'currency_code', subject.currency_code,
          'proposal_only', true
        ),
        'citations', citations,
        'proposed_next_step', 'Review or draft a recovery project if permitted.',
        'executes_actions', false, 'rule_version', subject.rule_version
      );
      end if;
    end if;
  else
    select * into subject
    from public.recovery_projects
    where organization_id = target_organization_id and id = target_subject_id;
    if not found then
      response_status := 'refused';
      response_summary := 'The requested project is unavailable within your effective permissions.';
      answer := jsonb_build_object(
        'status', response_status, 'heading', 'Project explanation refused',
        'summary', response_summary, 'citations', citations,
        'proposed_next_step', null, 'executes_actions', false,
        'rule_version', active_rule_version
      );
    else
      subject_location_id := subject.location_id;
      if not private.has_location_permission(target_organization_id, subject_location_id, 'project.view') then
      response_status := 'refused';
      response_summary := 'The requested project is unavailable within your effective permissions.';
      answer := jsonb_build_object(
        'status', response_status, 'heading', 'Project explanation refused',
        'summary', response_summary, 'citations', citations,
        'proposed_next_step', null, 'executes_actions', false,
        'rule_version', active_rule_version
      );
    else
      citations := jsonb_build_array(
        jsonb_build_object('source_type', 'recovery_project', 'record_id', subject.id, 'observed_at', subject.updated_at),
        jsonb_build_object('source_type', 'recovery_opportunity', 'record_id', subject.recovery_opportunity_id, 'observed_at', subject.updated_at)
      );
      response_status := 'answered';
      response_summary := subject.name || ' is ' || replace(subject.status, '_', ' ') || ' at workflow version ' || subject.version::text || '.';
      answer := jsonb_build_object(
        'status', response_status, 'heading', 'Recovery project explanation',
        'summary', response_summary, 'facts', subject.evidence_snapshot,
        'citations', citations,
        'proposed_next_step', case
          when subject.status = 'draft' then 'Submit the evidence-bound draft if permitted.'
          when subject.status = 'pending_approval' then 'Wait for an independent approval.'
          when subject.status in ('approved', 'in_progress') then 'Review permission-visible internal tasks.'
          else 'Review the recorded project outcome.'
        end,
        'executes_actions', false, 'rule_version', active_rule_version
      );
      end if;
    end if;
  end if;

  insert into public.copilot_activity_log (
    organization_id, user_id, question_category, subject_id,
    response_status, response_summary, citations, rule_version
  ) values (
    target_organization_id, actor_id, coalesce(left(question_category, 80), 'unsupported'), target_subject_id,
    response_status, response_summary, citations, active_rule_version
  );
  return answer;
end;
$$;

revoke all on function public.get_retail_copilot_answer(text, uuid) from public, anon;
grant execute on function public.get_retail_copilot_answer(text, uuid) to authenticated;

commit;
