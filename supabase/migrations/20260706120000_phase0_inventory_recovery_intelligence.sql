begin;

-- Phase 0 Milestone 4: database-authored deterministic intelligence. Clients
-- can request a run but cannot submit or mutate scores.

create table public.intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  rule_version text not null check (char_length(rule_version) between 8 and 120),
  status text not null check (status in ('completed', 'failed')),
  evaluated_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, snapshot_id, rule_version),
  foreign key (organization_id, snapshot_id) references public.inventory_snapshots(organization_id, id) on delete restrict
);

create table public.inventory_risk_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  intelligence_run_id uuid not null,
  inventory_position_id uuid not null,
  location_id uuid not null,
  age_status text not null check (age_status in ('known', 'unknown')),
  age_days integer check (age_days is null or age_days >= 0),
  age_band text check (age_band is null or age_band in ('fresh', 'watch', 'aged', 'dead')),
  sales_status text not null check (sales_status in ('known', 'unknown')),
  sales_trend text check (sales_trend is null or sales_trend in ('growing', 'stable', 'declining', 'new_activity', 'no_sales')),
  data_confidence_status text not null check (data_confidence_status in ('known', 'suppressed')),
  data_confidence_score numeric(5, 2) not null check (data_confidence_score between 0 and 100),
  inventory_risk_status text not null check (inventory_risk_status in ('known', 'unknown', 'suppressed')),
  inventory_risk_score numeric(5, 2) check (inventory_risk_score between 0 and 100),
  inventory_risk_band text check (inventory_risk_band is null or inventory_risk_band in ('low', 'moderate', 'high', 'critical')),
  recovery_opportunity_status text not null check (recovery_opportunity_status in ('known', 'unknown', 'suppressed')),
  recovery_opportunity_score numeric(5, 2) check (recovery_opportunity_score between 0 and 100),
  recovery_opportunity_band text check (recovery_opportunity_band is null or recovery_opportunity_band in ('monitor', 'review', 'strong')),
  attention_priority_status text not null check (attention_priority_status in ('known', 'unknown', 'suppressed')),
  attention_priority_score numeric(5, 2) check (attention_priority_score between 0 and 100),
  attention_priority_band text check (attention_priority_band is null or attention_priority_band in ('low', 'medium', 'high', 'urgent')),
  inventory_value numeric(18, 4) check (inventory_value is null or inventory_value >= 0),
  currency_code text check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  suppression_reason text,
  rule_version text not null,
  evidence jsonb not null,
  caveats jsonb not null default '[]'::jsonb,
  evaluated_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, intelligence_run_id, inventory_position_id),
  foreign key (organization_id, intelligence_run_id) references public.intelligence_runs(organization_id, id) on delete cascade,
  foreign key (organization_id, inventory_position_id) references public.inventory_positions(organization_id, id) on delete restrict,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create table public.recovery_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inventory_risk_insight_id uuid not null,
  location_id uuid not null,
  title text not null check (char_length(title) between 3 and 180),
  proposed_action text not null check (proposed_action in ('investigate', 'remediate', 'bundle', 'markdown', 'campaign', 'transfer')),
  status text not null default 'open' check (status in ('open', 'dismissed', 'projectised')),
  recovery_opportunity_score numeric(5, 2) not null check (recovery_opportunity_score between 0 and 100),
  recovery_opportunity_band text not null check (recovery_opportunity_band in ('review', 'strong')),
  attention_priority_score numeric(5, 2) not null check (attention_priority_score between 0 and 100),
  attention_priority_band text not null check (attention_priority_band in ('low', 'medium', 'high', 'urgent')),
  estimated_value numeric(18, 4) not null check (estimated_value >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  rule_version text not null,
  evidence jsonb not null,
  caveats jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, inventory_risk_insight_id),
  foreign key (organization_id, inventory_risk_insight_id) references public.inventory_risk_insights(organization_id, id) on delete cascade,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create table public.executive_briefings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  intelligence_run_id uuid not null,
  summary jsonb not null,
  caveats jsonb not null default '[]'::jsonb,
  rule_version text not null,
  generated_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, intelligence_run_id),
  foreign key (organization_id, intelligence_run_id) references public.intelligence_runs(organization_id, id) on delete cascade
);

create table public.action_cards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recovery_opportunity_id uuid not null,
  location_id uuid not null,
  title text not null check (char_length(title) between 3 and 180),
  proposed_action text not null,
  priority_band text not null check (priority_band in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'dismissed', 'projectised')),
  evidence jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, recovery_opportunity_id),
  foreign key (organization_id, recovery_opportunity_id) references public.recovery_opportunities(organization_id, id) on delete cascade,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create index intelligence_runs_org_created_idx on public.intelligence_runs (organization_id, created_at desc);
create index inventory_risk_attention_idx on public.inventory_risk_insights (organization_id, attention_priority_score desc nulls last);
create index recovery_opportunities_attention_idx on public.recovery_opportunities (organization_id, status, attention_priority_score desc);
create index action_cards_location_idx on public.action_cards (organization_id, location_id, status);

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
      'data.view','data.manage','inventory.view','intelligence.run','opportunity.view'
    ])
    when 'executive' then required_permission = any (array[
      'organization.view','members.view','audit.view','location.view','brand.view','onboarding.view','event.view',
      'data.view','inventory.view','opportunity.view'
    ])
    when 'merchandising_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','brand.manage','data.view','data.manage',
      'inventory.view','intelligence.run','opportunity.view'
    ])
    when 'store_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','inventory.view','opportunity.view'
    ])
    when 'viewer' then required_permission = any (array[
      'organization.view','location.view','brand.view','data.view','inventory.view','opportunity.view'
    ])
    else false
  end;
$$;

alter table public.intelligence_runs enable row level security;
alter table public.intelligence_runs force row level security;
alter table public.inventory_risk_insights enable row level security;
alter table public.inventory_risk_insights force row level security;
alter table public.recovery_opportunities enable row level security;
alter table public.recovery_opportunities force row level security;
alter table public.executive_briefings enable row level security;
alter table public.executive_briefings force row level security;
alter table public.action_cards enable row level security;
alter table public.action_cards force row level security;

create policy intelligence_runs_select on public.intelligence_runs
  for select to authenticated
  using (private.has_permission(organization_id, 'data.view'));
create policy inventory_risk_insights_select on public.inventory_risk_insights
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'opportunity.view'));
create policy recovery_opportunities_select on public.recovery_opportunities
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'opportunity.view'));
create policy executive_briefings_select on public.executive_briefings
  for select to authenticated
  using (
    exists (
      select 1
      from public.memberships membership
      where membership.organization_id = executive_briefings.organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and membership.role in ('org_owner', 'executive', 'merchandising_manager', 'viewer')
    )
  );
create policy action_cards_select on public.action_cards
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'opportunity.view'));

revoke all on table public.intelligence_runs from anon, authenticated;
revoke all on table public.inventory_risk_insights from anon, authenticated;
revoke all on table public.recovery_opportunities from anon, authenticated;
revoke all on table public.executive_briefings from anon, authenticated;
revoke all on table public.action_cards from anon, authenticated;
grant select on table public.intelligence_runs to authenticated;
grant select on table public.inventory_risk_insights to authenticated;
grant select on table public.recovery_opportunities to authenticated;
grant select on table public.executive_briefings to authenticated;
grant select on table public.action_cards to authenticated;

create or replace function public.run_inventory_recovery_intelligence()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_organization_id uuid;
  target_snapshot_id uuid;
  existing_run_id uuid;
  run_id uuid := gen_random_uuid();
  evaluated_at timestamptz := timezone('utc', now());
  active_rule_version constant text := 'retailos.phase0.inventory-recovery.v1';
  position record;
  completeness numeric;
  freshness numeric;
  consistency numeric;
  confidence numeric;
  age_days integer;
  age_band text;
  age_risk numeric;
  prior_equivalent numeric;
  sales_trend text;
  sales_risk numeric;
  risk_score numeric;
  risk_band text;
  inventory_value numeric;
  opportunity_score numeric;
  opportunity_band text;
  attention_score numeric;
  attention_band text;
  insight_id uuid;
  opportunity_id uuid;
  suppression text;
  totals_by_currency jsonb;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select membership.organization_id
  into target_organization_id
  from public.memberships membership
  where membership.user_id = actor_id
    and membership.status = 'active';
  if target_organization_id is null
    or not private.has_permission(target_organization_id, 'intelligence.run') then
    raise exception 'permission_denied';
  end if;

  select id into target_snapshot_id
  from public.inventory_snapshots
  where organization_id = target_organization_id
    and status = 'approved'
  order by observed_at desc, id desc
  limit 1;
  if target_snapshot_id is null then
    raise exception 'approved_snapshot_required';
  end if;

  select id into existing_run_id
  from public.intelligence_runs
  where organization_id = target_organization_id
    and snapshot_id = target_snapshot_id
    and intelligence_runs.rule_version = active_rule_version;
  if existing_run_id is not null then
    return existing_run_id;
  end if;

  insert into public.intelligence_runs (
    id, organization_id, snapshot_id, rule_version, status, evaluated_at, created_by
  ) values (
    run_id, target_organization_id, target_snapshot_id, active_rule_version,
    'completed', evaluated_at, actor_id
  );

  for position in
    select inventory.*
    from public.inventory_positions inventory
    where inventory.organization_id = target_organization_id
      and inventory.snapshot_id = target_snapshot_id
    order by inventory.id
  loop
    completeness := round((
      (case when position.first_available_at is not null then 1 else 0 end) +
      (case when position.approved_unit_cost is not null then 1 else 0 end) +
      (case when position.currency_code is not null then 1 else 0 end) +
      (case when position.units_sold_90 is not null then 1 else 0 end) +
      (case when position.units_sold_30 is not null then 1 else 0 end)
    )::numeric / 5 * 100, 2);
    freshness := case
      when evaluated_at - (
        select observed_at from public.inventory_snapshots where id = target_snapshot_id
      ) <= interval '1 day' then 100
      when evaluated_at - (
        select observed_at from public.inventory_snapshots where id = target_snapshot_id
      ) <= interval '7 days' then 85
      when evaluated_at - (
        select observed_at from public.inventory_snapshots where id = target_snapshot_id
      ) <= interval '30 days' then 65
      else 40
    end;
    consistency := case
      when (position.approved_unit_cost is null) <> (position.currency_code is null) then 50
      when position.units_sold_90 is not null
        and position.units_sold_30 is not null
        and position.units_sold_30 > position.units_sold_90 then 50
      else 100
    end;
    confidence := round(completeness * 0.4 + freshness * 0.3 + consistency * 0.3, 2);

    if position.first_available_at is null then
      age_days := null;
      age_band := null;
      age_risk := null;
    else
      age_days := greatest(0, evaluated_at::date - position.first_available_at);
      age_band := case
        when age_days <= 60 then 'fresh'
        when age_days <= 90 then 'watch'
        when age_days <= 180 then 'aged'
        else 'dead'
      end;
      age_risk := case age_band
        when 'fresh' then 10 when 'watch' then 35 when 'aged' then 70 else 100
      end;
    end if;

    if position.units_sold_90 is null or position.units_sold_30 is null then
      sales_trend := null;
      sales_risk := null;
    else
      prior_equivalent := (position.units_sold_90 - position.units_sold_30)::numeric / 2;
      sales_trend := case
        when prior_equivalent = 0 and position.units_sold_30 = 0 then 'no_sales'
        when prior_equivalent = 0 then 'new_activity'
        when ((position.units_sold_30 - prior_equivalent) / prior_equivalent) * 100 <= -10 then 'declining'
        when ((position.units_sold_30 - prior_equivalent) / prior_equivalent) * 100 >= 10 then 'growing'
        else 'stable'
      end;
      sales_risk := case
        when sales_trend = 'no_sales' then 100
        when sales_trend = 'new_activity' then 10
        when sales_trend = 'declining'
          and ((position.units_sold_30 - prior_equivalent) / prior_equivalent) * 100 <= -50 then 90
        when sales_trend = 'declining' then 70
        when sales_trend = 'stable' then 40
        else 15
      end;
    end if;

    suppression := null;
    risk_score := null;
    risk_band := null;
    inventory_value := null;
    opportunity_score := null;
    opportunity_band := null;
    attention_score := null;
    attention_band := null;

    if confidence < 60 then
      suppression := 'LOW_DATA_CONFIDENCE';
    elsif age_risk is null then
      suppression := 'MISSING_AGE_EVIDENCE';
    elsif sales_risk is null then
      suppression := 'INCOMPLETE_SALES_WINDOW';
    else
      risk_score := round(age_risk * 0.6 + sales_risk * 0.4, 2);
      risk_band := case
        when risk_score >= 80 then 'critical'
        when risk_score >= 60 then 'high'
        when risk_score >= 35 then 'moderate'
        else 'low'
      end;

      if position.approved_unit_cost is null then
        suppression := 'MISSING_APPROVED_COST';
      elsif position.currency_code is null then
        suppression := 'MISSING_CURRENCY';
      else
        inventory_value := round(position.on_hand_quantity * position.approved_unit_cost, 4);
        opportunity_score := round(risk_score * 0.75 + confidence * 0.25, 2);
        opportunity_band := case
          when opportunity_score >= 75 then 'strong'
          when opportunity_score >= 50 then 'review'
          else 'monitor'
        end;
        attention_score := round(
          opportunity_score * 0.6 + risk_score * 0.25 + confidence * 0.15,
          2
        );
        attention_band := case
          when attention_score >= 75 then 'urgent'
          when attention_score >= 60 then 'high'
          when attention_score >= 40 then 'medium'
          else 'low'
        end;
      end if;
    end if;

    insight_id := gen_random_uuid();
    insert into public.inventory_risk_insights (
      id, organization_id, intelligence_run_id, inventory_position_id,
      location_id, age_status, age_days, age_band, sales_status, sales_trend,
      data_confidence_status, data_confidence_score, inventory_risk_status,
      inventory_risk_score, inventory_risk_band, recovery_opportunity_status,
      recovery_opportunity_score, recovery_opportunity_band,
      attention_priority_status, attention_priority_score,
      attention_priority_band, inventory_value, currency_code,
      suppression_reason, rule_version, evidence, caveats, evaluated_at
    ) values (
      insight_id, target_organization_id, run_id, position.id,
      position.location_id,
      case when age_band is null then 'unknown' else 'known' end,
      age_days, age_band,
      case when sales_trend is null then 'unknown' else 'known' end,
      sales_trend,
      case when confidence < 60 then 'suppressed' else 'known' end,
      confidence,
      case
        when confidence < 60 then 'suppressed'
        when risk_score is null then 'unknown'
        else 'known'
      end,
      risk_score, risk_band,
      case
        when suppression in ('LOW_DATA_CONFIDENCE', 'MISSING_APPROVED_COST', 'MISSING_CURRENCY')
          then 'suppressed'
        when opportunity_score is null then 'unknown'
        else 'known'
      end,
      opportunity_score, opportunity_band,
      case
        when suppression in ('LOW_DATA_CONFIDENCE', 'MISSING_APPROVED_COST', 'MISSING_CURRENCY')
          then 'suppressed'
        when attention_score is null then 'unknown'
        else 'known'
      end,
      attention_score, attention_band, inventory_value, position.currency_code,
      suppression, active_rule_version,
      jsonb_build_object(
        'inventory_position_id', position.id,
        'snapshot_id', target_snapshot_id,
        'evaluated_at', evaluated_at,
        'confidence_basis', jsonb_build_object(
          'completeness', completeness,
          'freshness', freshness,
          'consistency', consistency,
          'weights', jsonb_build_object('completeness', 0.4, 'freshness', 0.3, 'consistency', 0.3)
        ),
        'risk_basis', jsonb_build_object('age_risk', age_risk, 'sales_risk', sales_risk)
      ),
      jsonb_build_array(
        'Proposal only: no price, stock, publishing, or customer action is executed.',
        'Phase 0 performs no currency conversion.'
      ),
      evaluated_at
    );

    if opportunity_score is not null and opportunity_score >= 50 then
      opportunity_id := gen_random_uuid();
      insert into public.recovery_opportunities (
        id, organization_id, inventory_risk_insight_id, location_id, title,
        proposed_action, recovery_opportunity_score,
        recovery_opportunity_band, attention_priority_score,
        attention_priority_band, estimated_value, currency_code,
        rule_version, evidence, caveats
      ) values (
        opportunity_id, target_organization_id, insight_id, position.location_id,
        case
          when age_band = 'dead' then 'Recover dead-stock inventory'
          when age_band = 'aged' then 'Review aged inventory recovery'
          else 'Review inventory recovery evidence'
        end,
        case
          when age_band = 'dead' then 'bundle'
          when age_band = 'aged' then 'campaign'
          else 'investigate'
        end,
        opportunity_score, opportunity_band, attention_score, attention_band,
        inventory_value, position.currency_code, active_rule_version,
        jsonb_build_object(
          'inventory_risk_insight_id', insight_id,
          'inventory_position_id', position.id,
          'snapshot_id', target_snapshot_id
        ),
        jsonb_build_array(
          'Internal proposal only; human approval is required before action.',
          'Estimated value uses approved unit cost without FX conversion.'
        )
      );

      insert into public.action_cards (
        organization_id, recovery_opportunity_id, location_id, title,
        proposed_action, priority_band, evidence
      ) values (
        target_organization_id, opportunity_id, position.location_id,
        'Review ' || coalesce(position.id::text, 'inventory evidence'),
        case
          when age_band = 'dead' then 'Prepare a bundle recovery proposal'
          when age_band = 'aged' then 'Prepare a campaign recovery proposal'
          else 'Investigate the current recovery evidence'
        end,
        attention_band,
        jsonb_build_object('recovery_opportunity_id', opportunity_id, 'snapshot_id', target_snapshot_id)
      );
    end if;
  end loop;

  select coalesce(jsonb_object_agg(currency_code, total_value), '{}'::jsonb)
  into totals_by_currency
  from (
    select opportunity.currency_code, round(sum(opportunity.estimated_value), 4) as total_value
    from public.recovery_opportunities opportunity
    join public.inventory_risk_insights insight
      on insight.organization_id = opportunity.organization_id
     and insight.id = opportunity.inventory_risk_insight_id
    where opportunity.organization_id = target_organization_id
      and insight.intelligence_run_id = run_id
    group by opportunity.currency_code
  ) totals;

  insert into public.executive_briefings (
    organization_id, intelligence_run_id, summary, caveats,
    rule_version, generated_at
  ) values (
    target_organization_id,
    run_id,
    jsonb_build_object(
      'attention_count', (
        select count(*) from public.recovery_opportunities opportunity
        join public.inventory_risk_insights insight
          on insight.organization_id = opportunity.organization_id
         and insight.id = opportunity.inventory_risk_insight_id
        where opportunity.organization_id = target_organization_id
          and insight.intelligence_run_id = run_id
      ),
      'suppressed_count', (
        select count(*) from public.inventory_risk_insights
        where organization_id = target_organization_id
          and intelligence_run_id = run_id
          and recovery_opportunity_status <> 'known'
      ),
      'totals_by_currency', totals_by_currency
    ),
    jsonb_build_array(
      'Currencies are reported separately; RetailOS does not invent FX rates.',
      'Scores below the confidence threshold are suppressed.'
    ),
    active_rule_version,
    evaluated_at
  );

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id, actor_id, 'inventory_intelligence.completed',
    'intelligence_run', run_id,
    jsonb_build_object('snapshot_id', target_snapshot_id, 'rule_version', active_rule_version)
  );
  insert into public.event_log (
    organization_id, scope, event_type, aggregate_type, aggregate_id,
    payload, idempotency_key
  ) values (
    target_organization_id, 'organization', 'intelligence.completed',
    'intelligence_run', run_id,
    jsonb_build_object('snapshot_id', target_snapshot_id, 'rule_version', active_rule_version),
    'intelligence:' || target_snapshot_id::text || ':' || active_rule_version
  );

  return run_id;
end;
$$;

revoke all on function public.run_inventory_recovery_intelligence() from public, anon;
grant execute on function public.run_inventory_recovery_intelligence() to authenticated;

commit;
