begin;

-- Phase 1 M1.9 — Inventory Operating System completion.
-- Adds stock-count review/closure, count-correction posting, persisted-derived
-- low/overstock watchlist, and inventory lookup read models. No POS, finance,
-- procurement, forecasting, or warehouse-management expansion is introduced.

alter table public.stock_counts
  drop constraint if exists stock_counts_status_check;

alter table public.stock_counts
  add constraint stock_counts_status_check
  check (status in ('submitted', 'reviewed', 'closed', 'cancelled'));

alter table public.stock_counts
  add column if not exists review_notes text check (review_notes is null or char_length(review_notes) <= 1000),
  add column if not exists closed_by uuid references auth.users(id) on delete restrict,
  add column if not exists closed_at timestamptz,
  add column if not exists closure_notes text check (closure_notes is null or char_length(closure_notes) <= 1000),
  add column if not exists correction_idempotency_key text,
  add column if not exists correlation_id uuid not null default gen_random_uuid();

alter table public.reconciliation_issues
  add column if not exists resolution_note text check (resolution_note is null or char_length(resolution_note) <= 1000);

alter table public.inventory_operation_idempotency_keys
  drop constraint if exists inventory_operation_idempotency_keys_operation_type_check;

alter table public.inventory_operation_idempotency_keys
  add constraint inventory_operation_idempotency_keys_operation_type_check
  check (
    operation_type in (
      'stock_adjustment_execute',
      'stock_adjustment_reverse',
      'transfer_dispatch',
      'transfer_receive',
      'stock_count_close'
    )
  );

create or replace view public.inventory_stock_watchlist
with (security_invoker = true)
as
select
  balance.organization_id,
  balance.sku_id,
  balance.sku_code,
  balance.barcode,
  balance.product_id,
  balance.product_name,
  balance.location_id,
  balance.location_name,
  balance.location_code,
  balance.on_hand_quantity,
  balance.available_quantity,
  balance.reserved_quantity,
  balance.in_transit_quantity,
  balance.units_sold_30,
  balance.units_sold_90,
  balance.approved_unit_cost,
  balance.currency_code,
  case
    when balance.available_quantity <= 0 then 'out_of_stock'
    when balance.available_quantity <= greatest(2, ceil(coalesce(balance.units_sold_30, 0)::numeric / 4.0)::integer) then 'low_stock'
    when balance.on_hand_quantity >= greatest(10, coalesce(balance.units_sold_90, 0) * 2)
      and coalesce(balance.units_sold_90, 0) <= 5 then 'overstock'
    when balance.in_transit_quantity > 0 then 'in_transit'
    else 'healthy'
  end as watch_status,
  case
    when balance.available_quantity <= 0 then 'high'
    when balance.available_quantity <= greatest(2, ceil(coalesce(balance.units_sold_30, 0)::numeric / 4.0)::integer) then 'medium'
    when balance.on_hand_quantity >= greatest(10, coalesce(balance.units_sold_90, 0) * 2)
      and coalesce(balance.units_sold_90, 0) <= 5 then 'medium'
    when balance.in_transit_quantity > 0 then 'low'
    else 'info'
  end as severity,
  case
    when balance.available_quantity <= 0 then 'No available units remain after reservations.'
    when balance.available_quantity <= greatest(2, ceil(coalesce(balance.units_sold_30, 0)::numeric / 4.0)::integer) then 'Available units are below the persisted sales-based watch threshold.'
    when balance.on_hand_quantity >= greatest(10, coalesce(balance.units_sold_90, 0) * 2)
      and coalesce(balance.units_sold_90, 0) <= 5 then 'On-hand units are high relative to persisted 90-day sales evidence.'
    when balance.in_transit_quantity > 0 then 'Units are in transit and need receiving follow-up.'
    else 'No watchlist issue from current persisted evidence.'
  end as evidence_summary,
  timezone('utc', now()) as calculated_at
from public.current_inventory_balances balance;

revoke all on table public.inventory_stock_watchlist from anon, authenticated;
grant select on table public.inventory_stock_watchlist to authenticated;

create or replace view public.inventory_lookup_items
with (security_invoker = true)
as
select
  balance.organization_id,
  balance.sku_id,
  balance.sku_code,
  balance.barcode,
  balance.product_id,
  balance.product_name,
  balance.location_id,
  balance.location_name,
  balance.location_code,
  balance.on_hand_quantity,
  balance.available_quantity,
  balance.reserved_quantity,
  balance.in_transit_quantity,
  balance.approved_unit_cost,
  balance.currency_code,
  balance.last_movement_at
from public.current_inventory_balances balance;

revoke all on table public.inventory_lookup_items from anon, authenticated;
grant select on table public.inventory_lookup_items to authenticated;

create or replace function public.review_stock_count(
  target_stock_count_id uuid,
  target_review_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  count_header public.stock_counts%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select * into count_header
  from public.stock_counts
  where id = target_stock_count_id
  for update;

  if count_header.id is null
    or not private.has_location_permission(count_header.organization_id, count_header.location_id, 'stock_count.manage') then
    raise exception 'permission_denied';
  end if;
  if count_header.status = 'reviewed' then
    return count_header.id;
  end if;
  if count_header.status <> 'submitted' then
    raise exception using errcode = '22023', message = 'stock_count_not_submitted';
  end if;

  update public.stock_counts
  set status = 'reviewed',
      reviewed_by = actor_id,
      reviewed_at = timezone('utc', now()),
      review_notes = nullif(trim(coalesce(target_review_notes, '')), '')
  where organization_id = count_header.organization_id
    and id = count_header.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    count_header.organization_id, actor_id, 'stock_count.reviewed',
    'stock_count', count_header.id,
    jsonb_build_object('location_id', count_header.location_id)
  );

  return count_header.id;
end;
$$;

create or replace function public.close_stock_count(
  target_stock_count_id uuid,
  target_issue_decisions jsonb default '[]'::jsonb,
  target_create_corrections boolean default false,
  target_idempotency_key text default null,
  target_closure_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  count_header public.stock_counts%rowtype;
  existing_result jsonb;
  decision jsonb;
  issue public.reconciliation_issues%rowtype;
  before_quantity integer;
  after_quantity integer;
  effective_idempotency_key text;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  effective_idempotency_key := coalesce(nullif(trim(coalesce(target_idempotency_key, '')), ''), 'stock-count-close-' || target_stock_count_id::text);

  if char_length(effective_idempotency_key) < 8 then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  select result into existing_result
  from public.inventory_operation_idempotency_keys
  where operation_type = 'stock_count_close'
    and source_id = target_stock_count_id
    and idempotency_key = effective_idempotency_key
  for update;
  if existing_result is not null then
    return (existing_result ->> 'stock_count_id')::uuid;
  end if;

  if jsonb_typeof(target_issue_decisions) <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_issue_decisions';
  end if;

  lock table public.inventory_movements in share row exclusive mode;

  select * into count_header
  from public.stock_counts
  where id = target_stock_count_id
  for update;

  if count_header.id is null
    or not private.has_location_permission(count_header.organization_id, count_header.location_id, 'stock_count.manage') then
    raise exception 'permission_denied';
  end if;
  if count_header.status = 'closed' then
    raise exception using errcode = '22023', message = 'stock_count_already_closed';
  end if;
  if count_header.status <> 'reviewed' then
    raise exception using errcode = '22023', message = 'stock_count_not_reviewed';
  end if;

  for decision in select value from jsonb_array_elements(target_issue_decisions)
  loop
    select * into issue
    from public.reconciliation_issues
    where organization_id = count_header.organization_id
      and stock_count_id = count_header.id
      and id = (decision ->> 'issue_id')::uuid
    for update;

    if issue.id is null then
      raise exception using errcode = '22023', message = 'issue_not_found';
    end if;

    if decision ->> 'status' not in ('resolved', 'dismissed') then
      raise exception using errcode = '22023', message = 'invalid_issue_status';
    end if;

    update public.reconciliation_issues
    set status = decision ->> 'status',
        resolved_by = actor_id,
        resolved_at = timezone('utc', now()),
        resolution_note = nullif(trim(coalesce(decision ->> 'resolution_note', '')), '')
    where organization_id = count_header.organization_id
      and id = issue.id;
  end loop;

  if exists (
    select 1
    from public.reconciliation_issues open_issue
    where open_issue.organization_id = count_header.organization_id
      and open_issue.stock_count_id = count_header.id
      and open_issue.status = 'open'
  ) then
    raise exception using errcode = '22023', message = 'stock_count_has_open_issues';
  end if;

  if target_create_corrections then
    for issue in
      select *
      from public.reconciliation_issues resolved_issue
      where resolved_issue.organization_id = count_header.organization_id
        and resolved_issue.stock_count_id = count_header.id
        and resolved_issue.status = 'resolved'
      order by resolved_issue.id
    loop
      if not exists (
        select 1
        from public.inventory_movements movement
        where movement.organization_id = count_header.organization_id
          and movement.source_type = 'stock_count'
          and movement.source_id = count_header.id
          and movement.sku_id = issue.sku_id
          and movement.location_id = issue.location_id
          and movement.movement_type = 'count_correction'
      ) then
        before_quantity := private.current_inventory_on_hand(count_header.organization_id, issue.sku_id, issue.location_id);
        after_quantity := before_quantity + issue.variance_quantity;
        if after_quantity < 0 then
          raise exception using errcode = '22023', message = 'insufficient_stock_for_count_correction';
        end if;

        insert into public.inventory_movements (
          organization_id, sku_id, location_id, movement_type, source_type,
          source_id, quantity_delta, quantity_before, quantity_after,
          reason, idempotency_key, correlation_id, created_by
        ) values (
          count_header.organization_id, issue.sku_id, issue.location_id,
          'count_correction', 'stock_count', count_header.id,
          issue.variance_quantity, before_quantity, after_quantity,
          coalesce(issue.resolution_note, 'Approved stock count correction'),
          effective_idempotency_key, count_header.correlation_id, actor_id
        );
      end if;
    end loop;
  end if;

  update public.stock_counts
  set status = 'closed',
      closed_by = actor_id,
      closed_at = timezone('utc', now()),
      closure_notes = nullif(trim(coalesce(target_closure_notes, '')), ''),
      correction_idempotency_key = effective_idempotency_key
  where organization_id = count_header.organization_id
    and id = count_header.id;

  perform private.record_inventory_idempotency_result(
    count_header.organization_id,
    'stock_count_close',
    count_header.id,
    effective_idempotency_key,
    jsonb_build_object('stock_count_id', count_header.id, 'status', 'closed'),
    actor_id
  );

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    count_header.organization_id, actor_id, 'stock_count.closed',
    'stock_count', count_header.id,
    jsonb_build_object(
      'location_id', count_header.location_id,
      'create_corrections', target_create_corrections
    )
  );

  return count_header.id;
end;
$$;

revoke all on function public.review_stock_count(uuid, text) from public, anon;
revoke all on function public.close_stock_count(uuid, jsonb, boolean, text, text) from public, anon;
grant execute on function public.review_stock_count(uuid, text) to authenticated;
grant execute on function public.close_stock_count(uuid, jsonb, boolean, text, text) to authenticated;

comment on view public.inventory_stock_watchlist is 'Phase 1 persisted-evidence low/overstock/in-transit watchlist derived from current inventory balances; not a forecast.';
comment on view public.inventory_lookup_items is 'Phase 1 SKU/barcode lookup read model derived from current inventory balances.';

commit;
