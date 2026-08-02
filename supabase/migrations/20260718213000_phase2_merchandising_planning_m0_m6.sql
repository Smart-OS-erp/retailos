begin;

-- Phase 2 M2.0-M2.6: Merchandising & Planning OS foundations.
-- This milestone creates historical merchandising intelligence and planning
-- contracts only. It does not execute markdowns, purchase orders, allocation
-- transfers, finance/accounting, wholesale, POS, or autonomous agent actions.

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
      'data.view','data.manage','inventory.view','inventory.manage','transfer.manage','stock_count.manage',
      'intelligence.run','opportunity.view','project.view','project.manage','project.approve',
      'task.view','task.manage','campaign_brief.view','campaign_brief.manage','campaign_brief.approve','copilot.use',
      'integration.view','integration.manage','integration.sync','integration.import',
      'merchandising.view','merchandising.manage'
    ])
    when 'executive' then required_permission = any (array[
      'organization.view','members.view','audit.view','location.view','brand.view','onboarding.view','event.view',
      'data.view','inventory.view','inventory.manage','transfer.manage','stock_count.manage',
      'opportunity.view','project.view','project.approve','task.view','campaign_brief.view','campaign_brief.approve',
      'copilot.use','integration.view','merchandising.view'
    ])
    when 'merchandising_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','brand.manage','data.view','data.manage',
      'inventory.view','inventory.manage','transfer.manage','stock_count.manage','intelligence.run',
      'opportunity.view','project.view','project.manage','task.view','task.manage',
      'campaign_brief.view','campaign_brief.manage','copilot.use',
      'integration.view','integration.manage','integration.sync','integration.import',
      'merchandising.view','merchandising.manage'
    ])
    when 'store_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','inventory.view','inventory.manage',
      'transfer.manage','stock_count.manage','opportunity.view','project.view','task.view','task.manage',
      'campaign_brief.view','copilot.use'
    ])
    when 'viewer' then required_permission = any (array[
      'organization.view','location.view','brand.view','data.view','inventory.view',
      'opportunity.view','project.view','task.view','campaign_brief.view','copilot.use',
      'merchandising.view'
    ])
    else false
  end;
$$;

create table if not exists public.merchandising_collections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  season_label text check (season_label is null or char_length(trim(season_label)) between 2 and 80),
  status text not null default 'planning' check (status in ('planning', 'active', 'archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, name)
);

create table if not exists public.product_collection_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  collection_id uuid not null,
  product_id uuid not null,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, collection_id, product_id),
  foreign key (organization_id, collection_id) references public.merchandising_collections(organization_id, id) on delete cascade,
  foreign key (organization_id, product_id) references public.products(organization_id, id) on delete cascade
);

create table if not exists public.merchandising_plan_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cycle_type text not null check (cycle_type in ('assortment', 'collection', 'markdown', 'allocation', 'replenishment')),
  season_label text not null check (char_length(trim(season_label)) between 2 and 80),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'archived')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id)
);

create table if not exists public.assortment_plan_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_cycle_id uuid not null,
  product_id uuid not null,
  product_role text not null check (product_role in ('core', 'carry_forward', 'test', 'exit', 'review')),
  target_location_count integer check (target_location_count is null or target_location_count >= 0),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, plan_cycle_id, product_id),
  foreign key (organization_id, plan_cycle_id) references public.merchandising_plan_cycles(organization_id, id) on delete cascade,
  foreign key (organization_id, product_id) references public.products(organization_id, id) on delete restrict
);

create table if not exists public.merchandising_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recommendation_type text not null check (recommendation_type in ('markdown', 'allocation_review', 'replenishment_watch', 'assortment_review')),
  product_id uuid not null,
  sku_id uuid,
  location_id uuid,
  title text not null check (char_length(trim(title)) between 3 and 160),
  rationale text not null check (char_length(trim(rationale)) between 3 and 1000),
  confidence_level text not null check (confidence_level in ('insufficient_data', 'low', 'medium', 'high')),
  status text not null default 'proposed' check (status in ('proposed', 'converted', 'approved', 'rejected', 'archived')),
  source_milestone text not null default 'M2.5',
  source_metrics jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  decided_by uuid references auth.users(id) on delete restrict,
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, product_id) references public.products(organization_id, id) on delete cascade,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete cascade,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create table if not exists public.markdown_plan_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recommendation_id uuid,
  product_id uuid not null,
  sku_id uuid,
  location_id uuid,
  recommended_discount_percent integer not null check (recommended_discount_percent between 1 and 80),
  reason text not null check (char_length(trim(reason)) between 3 and 1000),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'rejected', 'archived')),
  confidence_level text not null check (confidence_level in ('insufficient_data', 'low', 'medium', 'high')),
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, recommendation_id) references public.merchandising_recommendations(organization_id, id) on delete set null,
  foreign key (organization_id, product_id) references public.products(organization_id, id) on delete cascade,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete cascade,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create index if not exists merchandising_recommendations_status_idx
  on public.merchandising_recommendations (organization_id, status, recommendation_type, created_at desc);
create index if not exists markdown_plan_drafts_status_idx
  on public.markdown_plan_drafts (organization_id, status, created_at desc);
create index if not exists merchandising_plan_cycles_status_idx
  on public.merchandising_plan_cycles (organization_id, status, cycle_type, created_at desc);

drop trigger if exists merchandising_collections_set_updated_at on public.merchandising_collections;
create trigger merchandising_collections_set_updated_at before update on public.merchandising_collections
for each row execute function private.set_updated_at();
drop trigger if exists merchandising_plan_cycles_set_updated_at on public.merchandising_plan_cycles;
create trigger merchandising_plan_cycles_set_updated_at before update on public.merchandising_plan_cycles
for each row execute function private.set_updated_at();
drop trigger if exists assortment_plan_items_set_updated_at on public.assortment_plan_items;
create trigger assortment_plan_items_set_updated_at before update on public.assortment_plan_items
for each row execute function private.set_updated_at();
drop trigger if exists merchandising_recommendations_set_updated_at on public.merchandising_recommendations;
create trigger merchandising_recommendations_set_updated_at before update on public.merchandising_recommendations
for each row execute function private.set_updated_at();
drop trigger if exists markdown_plan_drafts_set_updated_at on public.markdown_plan_drafts;
create trigger markdown_plan_drafts_set_updated_at before update on public.markdown_plan_drafts
for each row execute function private.set_updated_at();

alter table public.merchandising_collections enable row level security;
alter table public.merchandising_collections force row level security;
alter table public.product_collection_assignments enable row level security;
alter table public.product_collection_assignments force row level security;
alter table public.merchandising_plan_cycles enable row level security;
alter table public.merchandising_plan_cycles force row level security;
alter table public.assortment_plan_items enable row level security;
alter table public.assortment_plan_items force row level security;
alter table public.merchandising_recommendations enable row level security;
alter table public.merchandising_recommendations force row level security;
alter table public.markdown_plan_drafts enable row level security;
alter table public.markdown_plan_drafts force row level security;

drop policy if exists merchandising_collections_select on public.merchandising_collections;
create policy merchandising_collections_select on public.merchandising_collections
  for select to authenticated
  using (private.has_permission(organization_id, 'merchandising.view'));
drop policy if exists merchandising_collections_insert on public.merchandising_collections;
create policy merchandising_collections_insert on public.merchandising_collections
  for insert to authenticated
  with check (private.has_permission(organization_id, 'merchandising.manage') and created_by = auth.uid());
drop policy if exists merchandising_collections_update on public.merchandising_collections;
create policy merchandising_collections_update on public.merchandising_collections
  for update to authenticated
  using (private.has_permission(organization_id, 'merchandising.manage'))
  with check (private.has_permission(organization_id, 'merchandising.manage'));

drop policy if exists product_collection_assignments_select on public.product_collection_assignments;
create policy product_collection_assignments_select on public.product_collection_assignments
  for select to authenticated
  using (private.has_permission(organization_id, 'merchandising.view'));
drop policy if exists product_collection_assignments_insert on public.product_collection_assignments;
create policy product_collection_assignments_insert on public.product_collection_assignments
  for insert to authenticated
  with check (private.has_permission(organization_id, 'merchandising.manage') and assigned_by = auth.uid());

drop policy if exists merchandising_plan_cycles_select on public.merchandising_plan_cycles;
create policy merchandising_plan_cycles_select on public.merchandising_plan_cycles
  for select to authenticated
  using (private.has_permission(organization_id, 'merchandising.view'));
drop policy if exists assortment_plan_items_select on public.assortment_plan_items;
create policy assortment_plan_items_select on public.assortment_plan_items
  for select to authenticated
  using (private.has_permission(organization_id, 'merchandising.view'));
drop policy if exists merchandising_recommendations_select on public.merchandising_recommendations;
create policy merchandising_recommendations_select on public.merchandising_recommendations
  for select to authenticated
  using (private.has_permission(organization_id, 'merchandising.view'));
drop policy if exists markdown_plan_drafts_select on public.markdown_plan_drafts;
create policy markdown_plan_drafts_select on public.markdown_plan_drafts
  for select to authenticated
  using (private.has_permission(organization_id, 'merchandising.view'));

revoke all on table public.merchandising_collections from anon, authenticated;
revoke all on table public.product_collection_assignments from anon, authenticated;
revoke all on table public.merchandising_plan_cycles from anon, authenticated;
revoke all on table public.assortment_plan_items from anon, authenticated;
revoke all on table public.merchandising_recommendations from anon, authenticated;
revoke all on table public.markdown_plan_drafts from anon, authenticated;
grant select on table public.merchandising_collections to authenticated;
grant select on table public.product_collection_assignments to authenticated;
grant select on table public.merchandising_plan_cycles to authenticated;
grant select on table public.assortment_plan_items to authenticated;
grant select on table public.merchandising_recommendations to authenticated;
grant select on table public.markdown_plan_drafts to authenticated;

create or replace view public.product_productivity_metrics
with (security_invoker = true)
as
with sales_window as (
  select
    sale.organization_id,
    sale.sku_id,
    sale.location_id,
    sum(sale.quantity) filter (where sale.sold_at >= timezone('utc', now()) - interval '30 days')::integer as units_sold_30,
    sum(sale.quantity) filter (where sale.sold_at >= timezone('utc', now()) - interval '90 days')::integer as units_sold_90,
    sum(sale.gross_amount) filter (where sale.sold_at >= timezone('utc', now()) - interval '90 days') as gross_revenue_90,
    max(sale.currency_code) filter (where sale.currency_code is not null) as sales_currency_code
  from public.sales_facts sale
  group by sale.organization_id, sale.sku_id, sale.location_id
),
latest_risk as (
  select distinct on (insight.organization_id, insight.inventory_position_id)
    insight.organization_id,
    insight.inventory_position_id,
    insight.inventory_risk_score,
    insight.inventory_risk_band,
    insight.data_confidence_score
  from public.inventory_risk_insights insight
  order by insight.organization_id, insight.inventory_position_id, insight.evaluated_at desc
)
select
  balance.organization_id,
  balance.product_id,
  balance.product_name,
  product.style_code,
  product.brand_id,
  brand.name as brand_name,
  product.category_id,
  category.name as category_name,
  collection.id as collection_id,
  collection.name as collection_name,
  balance.sku_id,
  balance.sku_code,
  balance.location_id,
  balance.location_name,
  balance.location_code,
  balance.on_hand_quantity,
  balance.available_quantity,
  balance.reserved_quantity,
  balance.in_transit_quantity,
  coalesce(sales_window.units_sold_30, balance.units_sold_30, 0)::integer as units_sold_30,
  coalesce(sales_window.units_sold_90, balance.units_sold_90, 0)::integer as units_sold_90,
  coalesce(sales_window.gross_revenue_90, 0)::numeric(18, 4) as gross_revenue_90,
  coalesce(balance.currency_code, sales_window.sales_currency_code) as currency_code,
  case
    when balance.approved_unit_cost is null then null
    else (balance.approved_unit_cost * balance.on_hand_quantity)::numeric(18, 4)
  end as inventory_value,
  case
    when (coalesce(sales_window.units_sold_90, balance.units_sold_90, 0) + balance.on_hand_quantity) <= 0 then null
    else round(
      (coalesce(sales_window.units_sold_90, balance.units_sold_90, 0)::numeric
        / nullif(coalesce(sales_window.units_sold_90, balance.units_sold_90, 0) + balance.on_hand_quantity, 0)) * 100,
      2
    )
  end as sell_through_rate_90,
  latest_risk.inventory_risk_score,
  latest_risk.inventory_risk_band,
  coalesce(latest_risk.data_confidence_score, 50)::numeric(5, 2) as data_confidence_score,
  case
    when coalesce(sales_window.units_sold_90, balance.units_sold_90, 0) = 0 and balance.on_hand_quantity > 0 then 'no_sales'
    when (coalesce(sales_window.units_sold_90, balance.units_sold_90, 0) + balance.on_hand_quantity) <= 0 then 'insufficient_data'
    when (coalesce(sales_window.units_sold_90, balance.units_sold_90, 0)::numeric / nullif(coalesce(sales_window.units_sold_90, balance.units_sold_90, 0) + balance.on_hand_quantity, 0)) >= 0.6 then 'high'
    when (coalesce(sales_window.units_sold_90, balance.units_sold_90, 0)::numeric / nullif(coalesce(sales_window.units_sold_90, balance.units_sold_90, 0) + balance.on_hand_quantity, 0)) >= 0.3 then 'moderate'
    else 'slow'
  end as productivity_band,
  case
    when coalesce(latest_risk.inventory_risk_band, 'low') in ('high', 'critical') and balance.on_hand_quantity > 0 then 'markdown_review'
    when coalesce(sales_window.units_sold_90, balance.units_sold_90, 0) = 0 and balance.on_hand_quantity > 0 then 'markdown_review'
    when balance.available_quantity <= greatest(coalesce(sales_window.units_sold_30, balance.units_sold_30, 0), 1)
      and coalesce(sales_window.units_sold_90, balance.units_sold_90, 0) > 0 then 'replenishment_watch'
    when balance.in_transit_quantity > 0 then 'allocation_review'
    else 'monitor'
  end as planning_signal,
  timezone('utc', now()) as calculated_at
from public.current_inventory_balances balance
join public.products product
  on product.organization_id = balance.organization_id
 and product.id = balance.product_id
left join public.brands brand
  on brand.organization_id = product.organization_id
 and brand.id = product.brand_id
left join public.categories category
  on category.organization_id = product.organization_id
 and category.id = product.category_id
left join public.product_collection_assignments assignment
  on assignment.organization_id = product.organization_id
 and assignment.product_id = product.id
left join public.merchandising_collections collection
  on collection.organization_id = assignment.organization_id
 and collection.id = assignment.collection_id
left join sales_window
  on sales_window.organization_id = balance.organization_id
 and sales_window.sku_id = balance.sku_id
 and sales_window.location_id = balance.location_id
left join latest_risk
  on latest_risk.organization_id = balance.organization_id
 and latest_risk.inventory_position_id = balance.inventory_position_id
where private.has_permission(balance.organization_id, 'merchandising.view');

create or replace view public.merchandising_group_performance
with (security_invoker = true)
as
select
  organization_id,
  group_type,
  group_id,
  group_name,
  count(distinct product_id)::integer as product_count,
  count(distinct sku_id)::integer as sku_count,
  sum(on_hand_quantity)::integer as on_hand_quantity,
  sum(available_quantity)::integer as available_quantity,
  sum(units_sold_90)::integer as units_sold_90,
  sum(gross_revenue_90)::numeric(18, 4) as gross_revenue_90,
  sum(inventory_value)::numeric(18, 4) as inventory_value,
  max(currency_code) as currency_code,
  round(avg(sell_through_rate_90), 2) as average_sell_through_rate_90,
  max(calculated_at) as calculated_at
from (
  select organization_id, 'brand'::text as group_type, brand_id as group_id, coalesce(brand_name, 'Unassigned brand') as group_name,
         product_id, sku_id, on_hand_quantity, available_quantity, units_sold_90, gross_revenue_90, inventory_value, currency_code, sell_through_rate_90, calculated_at
  from public.product_productivity_metrics
  union all
  select organization_id, 'category'::text as group_type, category_id as group_id, coalesce(category_name, 'Unassigned category') as group_name,
         product_id, sku_id, on_hand_quantity, available_quantity, units_sold_90, gross_revenue_90, inventory_value, currency_code, sell_through_rate_90, calculated_at
  from public.product_productivity_metrics
  union all
  select organization_id, 'collection'::text as group_type, collection_id as group_id, coalesce(collection_name, 'Unassigned collection') as group_name,
         product_id, sku_id, on_hand_quantity, available_quantity, units_sold_90, gross_revenue_90, inventory_value, currency_code, sell_through_rate_90, calculated_at
  from public.product_productivity_metrics
) grouped
group by organization_id, group_type, group_id, group_name;

revoke all on table public.product_productivity_metrics from anon, authenticated;
revoke all on table public.merchandising_group_performance from anon, authenticated;
grant select on table public.product_productivity_metrics to authenticated;
grant select on table public.merchandising_group_performance to authenticated;

create or replace function public.generate_merchandising_recommendations(
  target_organization_id uuid
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  inserted_count integer := 0;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.has_permission(target_organization_id, 'merchandising.manage') then
    raise exception 'permission_denied';
  end if;

  delete from public.merchandising_recommendations
  where organization_id = target_organization_id
    and status = 'proposed'
    and source_milestone = 'M2.5';

  insert into public.merchandising_recommendations (
    organization_id, recommendation_type, product_id, sku_id, location_id,
    title, rationale, confidence_level, source_metrics, created_by
  )
  select
    metric.organization_id,
    case
      when metric.planning_signal = 'markdown_review' then 'markdown'
      when metric.planning_signal = 'replenishment_watch' then 'replenishment_watch'
      when metric.planning_signal = 'allocation_review' then 'allocation_review'
      else 'assortment_review'
    end,
    metric.product_id,
    metric.sku_id,
    metric.location_id,
    case
      when metric.planning_signal = 'markdown_review' then 'Review markdown for ' || metric.product_name
      when metric.planning_signal = 'replenishment_watch' then 'Review replenishment for ' || metric.product_name
      when metric.planning_signal = 'allocation_review' then 'Review allocation for ' || metric.product_name
      else 'Review assortment role for ' || metric.product_name
    end,
    'Historical 90-day sales, current stock, and Phase 0 inventory-risk evidence indicate ' || replace(metric.planning_signal, '_', ' ') || '. This is directional planning evidence, not a forecast.',
    case
      when metric.units_sold_90 = 0 and metric.on_hand_quantity > 0 then 'low'
      when metric.data_confidence_score >= 80 and metric.units_sold_90 >= 10 then 'high'
      when metric.data_confidence_score >= 60 and metric.units_sold_90 > 0 then 'medium'
      else 'insufficient_data'
    end,
    jsonb_build_object(
      'planning_signal', metric.planning_signal,
      'productivity_band', metric.productivity_band,
      'units_sold_30', metric.units_sold_30,
      'units_sold_90', metric.units_sold_90,
      'on_hand_quantity', metric.on_hand_quantity,
      'available_quantity', metric.available_quantity,
      'sell_through_rate_90', metric.sell_through_rate_90,
      'data_confidence_score', metric.data_confidence_score
    ),
    actor_id
  from public.product_productivity_metrics metric
  where metric.organization_id = target_organization_id
    and metric.planning_signal <> 'monitor'
  order by metric.data_confidence_score desc, metric.units_sold_90 desc
  limit 100;

  get diagnostics inserted_count = row_count;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id, actor_id, 'merchandising_recommendations.generated',
    'merchandising_recommendations', null,
    jsonb_build_object('inserted_count', inserted_count, 'source_milestone', 'M2.5')
  );

  return inserted_count;
end;
$$;

create or replace function public.create_markdown_plan_draft(
  target_recommendation_id uuid,
  target_discount_percent integer,
  target_reason text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  recommendation public.merchandising_recommendations%rowtype;
  draft_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select * into recommendation
  from public.merchandising_recommendations
  where id = target_recommendation_id
  for update;

  if recommendation.id is null
    or recommendation.recommendation_type <> 'markdown'
    or not private.has_permission(recommendation.organization_id, 'merchandising.manage') then
    raise exception 'permission_denied';
  end if;

  insert into public.markdown_plan_drafts (
    organization_id, recommendation_id, product_id, sku_id, location_id,
    recommended_discount_percent, reason, confidence_level, created_by
  ) values (
    recommendation.organization_id, recommendation.id, recommendation.product_id,
    recommendation.sku_id, recommendation.location_id, target_discount_percent,
    trim(target_reason), recommendation.confidence_level, actor_id
  )
  returning id into draft_id;

  update public.merchandising_recommendations
  set status = 'converted',
      decided_by = actor_id,
      decided_at = timezone('utc', now())
  where organization_id = recommendation.organization_id
    and id = recommendation.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    recommendation.organization_id, actor_id, 'markdown_plan_draft.created',
    'markdown_plan_draft', draft_id,
    jsonb_build_object('recommendation_id', recommendation.id, 'discount_percent', target_discount_percent)
  );

  return draft_id;
end;
$$;

create or replace function public.create_merchandising_plan_cycle(
  target_organization_id uuid,
  target_cycle_type text,
  target_season_label text,
  target_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  cycle_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.has_permission(target_organization_id, 'merchandising.manage') then
    raise exception 'permission_denied';
  end if;

  insert into public.merchandising_plan_cycles (
    organization_id, cycle_type, season_label, notes, created_by
  ) values (
    target_organization_id, target_cycle_type, trim(target_season_label),
    nullif(trim(coalesce(target_notes, '')), ''), actor_id
  )
  returning id into cycle_id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id, actor_id, 'merchandising_plan_cycle.created',
    'merchandising_plan_cycle', cycle_id,
    jsonb_build_object('cycle_type', target_cycle_type, 'season_label', trim(target_season_label))
  );

  return cycle_id;
end;
$$;

create or replace function public.add_assortment_plan_item(
  target_plan_cycle_id uuid,
  target_product_id uuid,
  target_product_role text,
  target_target_location_count integer default null,
  target_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  cycle public.merchandising_plan_cycles%rowtype;
  item_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select * into cycle
  from public.merchandising_plan_cycles
  where id = target_plan_cycle_id;

  if cycle.id is null
    or cycle.status not in ('draft', 'in_review')
    or not private.has_permission(cycle.organization_id, 'merchandising.manage') then
    raise exception 'permission_denied';
  end if;

  if not exists (
    select 1 from public.products product
    where product.organization_id = cycle.organization_id
      and product.id = target_product_id
  ) then
    raise exception 'product_not_found';
  end if;

  insert into public.assortment_plan_items (
    organization_id, plan_cycle_id, product_id, product_role,
    target_location_count, notes, created_by
  ) values (
    cycle.organization_id, cycle.id, target_product_id, target_product_role,
    target_target_location_count, nullif(trim(coalesce(target_notes, '')), ''), actor_id
  )
  on conflict (organization_id, plan_cycle_id, product_id)
  do update set
    product_role = excluded.product_role,
    target_location_count = excluded.target_location_count,
    notes = excluded.notes,
    updated_at = timezone('utc', now())
  returning id into item_id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    cycle.organization_id, actor_id, 'assortment_plan_item.upserted',
    'assortment_plan_item', item_id,
    jsonb_build_object('plan_cycle_id', cycle.id, 'product_id', target_product_id, 'product_role', target_product_role)
  );

  return item_id;
end;
$$;

create or replace function public.approve_merchandising_plan_cycle(
  target_plan_cycle_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  cycle public.merchandising_plan_cycles%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select * into cycle
  from public.merchandising_plan_cycles
  where id = target_plan_cycle_id
  for update;

  if cycle.id is null
    or not private.has_permission(cycle.organization_id, 'merchandising.manage') then
    raise exception 'permission_denied';
  end if;

  update public.merchandising_plan_cycles
  set status = 'approved',
      approved_by = actor_id,
      approved_at = timezone('utc', now())
  where organization_id = cycle.organization_id
    and id = cycle.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    cycle.organization_id, actor_id, 'merchandising_plan_cycle.approved',
    'merchandising_plan_cycle', cycle.id,
    jsonb_build_object('cycle_type', cycle.cycle_type)
  );

  return cycle.id;
end;
$$;

revoke all on function public.generate_merchandising_recommendations(uuid) from public, anon;
revoke all on function public.create_markdown_plan_draft(uuid, integer, text) from public, anon;
revoke all on function public.create_merchandising_plan_cycle(uuid, text, text, text) from public, anon;
revoke all on function public.add_assortment_plan_item(uuid, uuid, text, integer, text) from public, anon;
revoke all on function public.approve_merchandising_plan_cycle(uuid) from public, anon;
grant execute on function public.generate_merchandising_recommendations(uuid) to authenticated;
grant execute on function public.create_markdown_plan_draft(uuid, integer, text) to authenticated;
grant execute on function public.create_merchandising_plan_cycle(uuid, text, text, text) to authenticated;
grant execute on function public.add_assortment_plan_item(uuid, uuid, text, integer, text) to authenticated;
grant execute on function public.approve_merchandising_plan_cycle(uuid) to authenticated;

comment on view public.product_productivity_metrics is 'Phase 2 M2.1 historical product productivity metrics from persisted inventory and sales facts; not a forecast.';
comment on view public.merchandising_group_performance is 'Phase 2 M2.2 brand/category/collection performance read model using persisted product, inventory, and sales facts.';
comment on table public.markdown_plan_drafts is 'Phase 2 M2.3 markdown planning drafts. Drafts do not execute prices or promotions.';
comment on table public.merchandising_plan_cycles is 'Phase 2 M2.4 assortment/collection/allocation/replenishment planning contract.';
comment on table public.merchandising_recommendations is 'Phase 2 M2.5 approval-ready planning recommendations with honest confidence labels and no automatic execution.';

commit;
