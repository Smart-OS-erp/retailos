begin;

-- Phase 1 — Inventory Operations Core.
-- Extends the accepted inventory foundation from request/approval records into
-- operational inventory controls: current balances, executable adjustments,
-- transfer dispatch/receipt, discrepancies, idempotency, and audit evidence.

alter table public.inventory_movements
  add column if not exists quantity_before integer,
  add column if not exists quantity_after integer,
  add column if not exists idempotency_key text,
  add column if not exists correlation_id uuid not null default gen_random_uuid(),
  add column if not exists reverses_movement_id uuid references public.inventory_movements(id) on delete restrict;

alter table public.inventory_movements
  drop constraint if exists inventory_movements_quantity_after_matches_delta;

alter table public.inventory_movements
  add constraint inventory_movements_quantity_after_matches_delta
  check (
    quantity_before is null
    or quantity_after is null
    or quantity_after = quantity_before + quantity_delta
  );

create unique index if not exists inventory_movements_idempotency_unique
  on public.inventory_movements (organization_id, source_type, source_id, idempotency_key, movement_type, sku_id, location_id)
  where idempotency_key is not null;

alter table public.stock_adjustments
  drop constraint if exists stock_adjustments_status_check;

alter table public.stock_adjustments
  add constraint stock_adjustments_status_check
  check (status in ('pending_approval', 'approved', 'rejected', 'cancelled', 'executed', 'reversed'));

alter table public.stock_adjustments
  add column if not exists rejected_by uuid references auth.users(id) on delete restrict,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 500),
  add column if not exists executed_by uuid references auth.users(id) on delete restrict,
  add column if not exists executed_at timestamptz,
  add column if not exists reversed_by uuid references auth.users(id) on delete restrict,
  add column if not exists reversed_at timestamptz,
  add column if not exists reversal_reason text check (reversal_reason is null or char_length(reversal_reason) <= 500),
  add column if not exists correlation_id uuid not null default gen_random_uuid();

alter table public.transfer_requests
  drop constraint if exists transfer_requests_status_check;

alter table public.transfer_requests
  add constraint transfer_requests_status_check
  check (
    status in (
      'pending_approval',
      'approved',
      'rejected',
      'cancelled',
      'picking',
      'dispatched',
      'in_transit',
      'partially_received',
      'received',
      'exception'
    )
  );

alter table public.transfer_requests
  add column if not exists rejected_by uuid references auth.users(id) on delete restrict,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 500),
  add column if not exists dispatched_by uuid references auth.users(id) on delete restrict,
  add column if not exists dispatched_at timestamptz,
  add column if not exists received_by uuid references auth.users(id) on delete restrict,
  add column if not exists received_at timestamptz,
  add column if not exists correlation_id uuid not null default gen_random_uuid();

alter table public.transfer_items
  add column if not exists approved_quantity integer,
  add column if not exists dispatched_quantity integer not null default 0,
  add column if not exists received_quantity integer not null default 0,
  add column if not exists damaged_quantity integer not null default 0;

update public.transfer_items
set approved_quantity = requested_quantity
where approved_quantity is null
  and exists (
    select 1
    from public.transfer_requests request
    where request.organization_id = transfer_items.organization_id
      and request.id = transfer_items.transfer_request_id
      and request.status <> 'pending_approval'
  );

alter table public.transfer_items
  drop constraint if exists transfer_items_operational_quantities_check;

alter table public.transfer_items
  add constraint transfer_items_operational_quantities_check
  check (
    (approved_quantity is null or approved_quantity between 1 and requested_quantity)
    and dispatched_quantity >= 0
    and received_quantity >= 0
    and damaged_quantity >= 0
    and (approved_quantity is null or dispatched_quantity <= approved_quantity)
    and received_quantity + damaged_quantity <= dispatched_quantity
  );

create table if not exists public.inventory_operation_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operation_type text not null check (
    operation_type in (
      'stock_adjustment_execute',
      'stock_adjustment_reverse',
      'transfer_dispatch',
      'transfer_receive'
    )
  ),
  source_id uuid not null,
  idempotency_key text not null check (char_length(trim(idempotency_key)) between 8 and 200),
  result jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, operation_type, source_id, idempotency_key)
);

create table if not exists public.transfer_discrepancies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  transfer_request_id uuid not null,
  transfer_item_id uuid not null,
  sku_id uuid not null,
  discrepancy_type text not null check (discrepancy_type in ('short_receipt', 'damaged_in_transit')),
  expected_quantity integer not null check (expected_quantity >= 0),
  received_quantity integer not null check (received_quantity >= 0),
  damaged_quantity integer not null default 0 check (damaged_quantity >= 0),
  variance_quantity integer not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  resolved_by uuid references auth.users(id) on delete restrict,
  resolved_at timestamptz,
  unique (organization_id, id),
  unique (organization_id, transfer_item_id, discrepancy_type),
  foreign key (organization_id, transfer_request_id) references public.transfer_requests(organization_id, id) on delete cascade,
  foreign key (organization_id, transfer_item_id) references public.transfer_items(organization_id, id) on delete cascade,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict
);

create index if not exists inventory_operation_idempotency_source_idx
  on public.inventory_operation_idempotency_keys (organization_id, operation_type, source_id, created_at desc);

create index if not exists transfer_discrepancies_request_idx
  on public.transfer_discrepancies (organization_id, transfer_request_id, status, created_at desc);

alter table public.inventory_operation_idempotency_keys enable row level security;
alter table public.inventory_operation_idempotency_keys force row level security;
alter table public.transfer_discrepancies enable row level security;
alter table public.transfer_discrepancies force row level security;

drop policy if exists inventory_operation_idempotency_keys_select on public.inventory_operation_idempotency_keys;
create policy inventory_operation_idempotency_keys_select on public.inventory_operation_idempotency_keys
  for select to authenticated
  using (private.has_permission(organization_id, 'audit.view'));

drop policy if exists transfer_discrepancies_select on public.transfer_discrepancies;
create policy transfer_discrepancies_select on public.transfer_discrepancies
  for select to authenticated
  using (
    exists (
      select 1
      from public.transfer_requests request
      where request.organization_id = transfer_discrepancies.organization_id
        and request.id = transfer_discrepancies.transfer_request_id
        and (
          private.has_location_permission(request.organization_id, request.origin_location_id, 'inventory.view')
          or private.has_location_permission(request.organization_id, request.destination_location_id, 'inventory.view')
        )
    )
  );

revoke all on table public.inventory_operation_idempotency_keys from anon, authenticated;
revoke all on table public.transfer_discrepancies from anon, authenticated;
grant select on table public.inventory_operation_idempotency_keys to authenticated;
grant select on table public.transfer_discrepancies to authenticated;

create or replace view public.current_inventory_balances
with (security_invoker = true)
as
with latest_position as (
  select distinct on (position.organization_id, position.sku_id, position.location_id)
    position.id as inventory_position_id,
    position.organization_id,
    position.sku_id,
    sku.sku_code,
    sku.barcode,
    product.id as product_id,
    product.name as product_name,
    product.brand_id,
    position.location_id,
    location.name as location_name,
    location.code as location_code,
    position.on_hand_quantity as snapshot_on_hand_quantity,
    position.approved_unit_cost,
    position.currency_code,
    snapshot.observed_at,
    position.first_available_at,
    position.units_sold_90,
    position.units_sold_30
  from public.inventory_positions position
  join public.inventory_snapshots snapshot
    on snapshot.organization_id = position.organization_id
   and snapshot.id = position.snapshot_id
   and snapshot.status = 'approved'
  join public.skus sku
    on sku.organization_id = position.organization_id
   and sku.id = position.sku_id
  join public.products product
    on product.organization_id = sku.organization_id
   and product.id = sku.product_id
  join public.locations location
    on location.organization_id = position.organization_id
   and location.id = position.location_id
  order by
    position.organization_id,
    position.sku_id,
    position.location_id,
    snapshot.observed_at desc,
    snapshot.created_at desc
),
movement_totals as (
  select
    organization_id,
    sku_id,
    location_id,
    coalesce(sum(quantity_delta), 0)::integer as movement_delta,
    max(occurred_at) as last_movement_at,
    (array_agg(id order by occurred_at desc, created_at desc))[1] as last_movement_id
  from public.inventory_movements
  group by organization_id, sku_id, location_id
),
transfer_reservations as (
  select
    request.organization_id,
    item.sku_id,
    request.origin_location_id as location_id,
    coalesce(sum(coalesce(item.approved_quantity, item.requested_quantity) - item.dispatched_quantity), 0)::integer as reserved_quantity
  from public.transfer_requests request
  join public.transfer_items item
    on item.organization_id = request.organization_id
   and item.transfer_request_id = request.id
  where request.status in ('approved', 'picking')
  group by request.organization_id, item.sku_id, request.origin_location_id
),
transfer_transit as (
  select
    request.organization_id,
    item.sku_id,
    request.destination_location_id as location_id,
    coalesce(sum(item.dispatched_quantity - item.received_quantity - item.damaged_quantity), 0)::integer as in_transit_quantity
  from public.transfer_requests request
  join public.transfer_items item
    on item.organization_id = request.organization_id
   and item.transfer_request_id = request.id
  where request.status in ('dispatched', 'in_transit', 'partially_received', 'exception')
  group by request.organization_id, item.sku_id, request.destination_location_id
)
select
  latest_position.inventory_position_id,
  latest_position.organization_id,
  latest_position.sku_id,
  latest_position.sku_code,
  latest_position.barcode,
  latest_position.product_id,
  latest_position.product_name,
  latest_position.brand_id,
  latest_position.location_id,
  latest_position.location_name,
  latest_position.location_code,
  latest_position.snapshot_on_hand_quantity,
  coalesce(movement_totals.movement_delta, 0)::integer as movement_delta,
  (latest_position.snapshot_on_hand_quantity + coalesce(movement_totals.movement_delta, 0))::integer as on_hand_quantity,
  coalesce(transfer_reservations.reserved_quantity, 0)::integer as reserved_quantity,
  greatest(
    (latest_position.snapshot_on_hand_quantity + coalesce(movement_totals.movement_delta, 0))
      - coalesce(transfer_reservations.reserved_quantity, 0),
    0
  )::integer as available_quantity,
  coalesce(transfer_transit.in_transit_quantity, 0)::integer as in_transit_quantity,
  0::integer as damaged_quantity,
  0::integer as quarantined_quantity,
  latest_position.approved_unit_cost,
  latest_position.currency_code,
  latest_position.observed_at,
  latest_position.first_available_at,
  latest_position.units_sold_90,
  latest_position.units_sold_30,
  movement_totals.last_movement_id,
  movement_totals.last_movement_at
from latest_position
left join movement_totals
  on movement_totals.organization_id = latest_position.organization_id
 and movement_totals.sku_id = latest_position.sku_id
 and movement_totals.location_id = latest_position.location_id
left join transfer_reservations
  on transfer_reservations.organization_id = latest_position.organization_id
 and transfer_reservations.sku_id = latest_position.sku_id
 and transfer_reservations.location_id = latest_position.location_id
left join transfer_transit
  on transfer_transit.organization_id = latest_position.organization_id
 and transfer_transit.sku_id = latest_position.sku_id
 and transfer_transit.location_id = latest_position.location_id;

revoke all on table public.current_inventory_balances from anon, authenticated;
grant select on table public.current_inventory_balances to authenticated;

create or replace function private.current_inventory_on_hand(
  target_organization_id uuid,
  target_sku_id uuid,
  target_location_id uuid
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with latest_position as (
    select position.on_hand_quantity
    from public.inventory_positions position
    join public.inventory_snapshots snapshot
      on snapshot.organization_id = position.organization_id
     and snapshot.id = position.snapshot_id
     and snapshot.status = 'approved'
    where position.organization_id = target_organization_id
      and position.sku_id = target_sku_id
      and position.location_id = target_location_id
    order by snapshot.observed_at desc, snapshot.created_at desc
    limit 1
  ),
  movement_total as (
    select coalesce(sum(quantity_delta), 0)::integer as quantity
    from public.inventory_movements
    where organization_id = target_organization_id
      and sku_id = target_sku_id
      and location_id = target_location_id
  )
  select coalesce((select on_hand_quantity from latest_position), 0)
    + coalesce((select quantity from movement_total), 0);
$$;

create or replace function private.current_inventory_available(
  target_organization_id uuid,
  target_sku_id uuid,
  target_location_id uuid
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with reserved as (
    select coalesce(sum(coalesce(item.approved_quantity, item.requested_quantity) - item.dispatched_quantity), 0)::integer as quantity
    from public.transfer_requests request
    join public.transfer_items item
      on item.organization_id = request.organization_id
     and item.transfer_request_id = request.id
    where request.organization_id = target_organization_id
      and request.origin_location_id = target_location_id
      and item.sku_id = target_sku_id
      and request.status in ('approved', 'picking')
  )
  select greatest(
    private.current_inventory_on_hand(target_organization_id, target_sku_id, target_location_id)
      - coalesce((select quantity from reserved), 0),
    0
  )::integer;
$$;

create or replace function private.record_inventory_idempotency_result(
  target_organization_id uuid,
  target_operation_type text,
  target_source_id uuid,
  target_idempotency_key text,
  target_result jsonb,
  actor_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.inventory_operation_idempotency_keys (
    organization_id,
    operation_type,
    source_id,
    idempotency_key,
    result,
    created_by
  ) values (
    target_organization_id,
    target_operation_type,
    target_source_id,
    trim(target_idempotency_key),
    target_result,
    actor_id
  )
  on conflict (organization_id, operation_type, source_id, idempotency_key)
  do nothing;
$$;

create or replace function public.approve_stock_adjustment(target_adjustment_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  adjustment public.stock_adjustments%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select * into adjustment
  from public.stock_adjustments
  where id = target_adjustment_id
  for update;

  if adjustment.id is null
    or not private.has_location_permission(adjustment.organization_id, adjustment.location_id, 'inventory.manage') then
    raise exception 'permission_denied';
  end if;

  if adjustment.status in ('approved', 'executed', 'reversed') then
    return adjustment.id;
  end if;
  if adjustment.status <> 'pending_approval' then
    raise exception using errcode = '22023', message = 'adjustment_not_pending';
  end if;

  update public.stock_adjustments
  set status = 'approved',
      approved_by = actor_id,
      approved_at = timezone('utc', now())
  where organization_id = adjustment.organization_id
    and id = adjustment.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    adjustment.organization_id, actor_id, 'stock_adjustment.approved',
    'stock_adjustment', adjustment.id,
    jsonb_build_object('location_id', adjustment.location_id)
  );

  return adjustment.id;
end;
$$;

create or replace function public.reject_stock_adjustment(
  target_adjustment_id uuid,
  target_rejection_reason text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  adjustment public.stock_adjustments%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select * into adjustment
  from public.stock_adjustments
  where id = target_adjustment_id
  for update;

  if adjustment.id is null
    or not private.has_location_permission(adjustment.organization_id, adjustment.location_id, 'inventory.manage') then
    raise exception 'permission_denied';
  end if;
  if adjustment.status = 'rejected' then
    return adjustment.id;
  end if;
  if adjustment.status <> 'pending_approval' then
    raise exception using errcode = '22023', message = 'adjustment_not_pending';
  end if;

  update public.stock_adjustments
  set status = 'rejected',
      rejected_by = actor_id,
      rejected_at = timezone('utc', now()),
      rejection_reason = nullif(trim(coalesce(target_rejection_reason, '')), '')
  where organization_id = adjustment.organization_id
    and id = adjustment.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    adjustment.organization_id, actor_id, 'stock_adjustment.rejected',
    'stock_adjustment', adjustment.id,
    jsonb_build_object('location_id', adjustment.location_id)
  );

  return adjustment.id;
end;
$$;

create or replace function public.execute_stock_adjustment(
  target_adjustment_id uuid,
  target_idempotency_key text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  adjustment public.stock_adjustments%rowtype;
  existing_result jsonb;
  item record;
  before_quantity integer;
  after_quantity integer;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;
  if target_idempotency_key is null or char_length(trim(target_idempotency_key)) < 8 then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  select result into existing_result
  from public.inventory_operation_idempotency_keys
  where operation_type = 'stock_adjustment_execute'
    and source_id = target_adjustment_id
    and idempotency_key = trim(target_idempotency_key)
  for update;
  if existing_result is not null then
    return (existing_result ->> 'adjustment_id')::uuid;
  end if;

  lock table public.inventory_movements in share row exclusive mode;

  select * into adjustment
  from public.stock_adjustments
  where id = target_adjustment_id
  for update;

  if adjustment.id is null
    or not private.has_location_permission(adjustment.organization_id, adjustment.location_id, 'inventory.manage') then
    raise exception 'permission_denied';
  end if;
  if adjustment.status = 'executed' then
    raise exception using errcode = '22023', message = 'adjustment_already_executed';
  end if;
  if adjustment.status <> 'approved' then
    raise exception using errcode = '22023', message = 'adjustment_not_approved';
  end if;

  for item in
    select adjustment_item.*, sku.approved_unit_cost, sku.currency_code
    from public.stock_adjustment_items adjustment_item
    join public.skus sku
      on sku.organization_id = adjustment_item.organization_id
     and sku.id = adjustment_item.sku_id
    where adjustment_item.organization_id = adjustment.organization_id
      and adjustment_item.stock_adjustment_id = adjustment.id
    order by adjustment_item.id
  loop
    before_quantity := private.current_inventory_on_hand(adjustment.organization_id, item.sku_id, adjustment.location_id);
    after_quantity := before_quantity + item.quantity_delta;
    if after_quantity < 0 then
      raise exception using errcode = '22023', message = 'insufficient_stock';
    end if;

    insert into public.inventory_movements (
      organization_id, sku_id, location_id, movement_type, source_type,
      source_id, quantity_delta, quantity_before, quantity_after,
      unit_cost, currency_code, reason, idempotency_key, correlation_id, created_by
    ) values (
      adjustment.organization_id, item.sku_id, adjustment.location_id,
      'adjustment', 'stock_adjustment', adjustment.id, item.quantity_delta,
      before_quantity, after_quantity, item.approved_unit_cost, item.currency_code,
      coalesce(item.reason, adjustment.reason), trim(target_idempotency_key),
      adjustment.correlation_id, actor_id
    );
  end loop;

  update public.stock_adjustments
  set status = 'executed',
      executed_by = actor_id,
      executed_at = timezone('utc', now())
  where organization_id = adjustment.organization_id
    and id = adjustment.id;

  perform private.record_inventory_idempotency_result(
    adjustment.organization_id,
    'stock_adjustment_execute',
    adjustment.id,
    target_idempotency_key,
    jsonb_build_object('adjustment_id', adjustment.id, 'status', 'executed'),
    actor_id
  );

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    adjustment.organization_id, actor_id, 'stock_adjustment.executed',
    'stock_adjustment', adjustment.id,
    jsonb_build_object('location_id', adjustment.location_id)
  );

  return adjustment.id;
end;
$$;

create or replace function public.reverse_stock_adjustment(
  target_adjustment_id uuid,
  target_reversal_reason text,
  target_idempotency_key text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  adjustment public.stock_adjustments%rowtype;
  existing_result jsonb;
  movement record;
  before_quantity integer;
  after_quantity integer;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;
  if target_idempotency_key is null or char_length(trim(target_idempotency_key)) < 8 then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if target_reversal_reason is null or char_length(trim(target_reversal_reason)) < 3 then
    raise exception using errcode = '22023', message = 'reversal_reason_required';
  end if;

  select result into existing_result
  from public.inventory_operation_idempotency_keys
  where operation_type = 'stock_adjustment_reverse'
    and source_id = target_adjustment_id
    and idempotency_key = trim(target_idempotency_key)
  for update;
  if existing_result is not null then
    return (existing_result ->> 'adjustment_id')::uuid;
  end if;

  lock table public.inventory_movements in share row exclusive mode;

  select * into adjustment
  from public.stock_adjustments
  where id = target_adjustment_id
  for update;

  if adjustment.id is null
    or not private.has_location_permission(adjustment.organization_id, adjustment.location_id, 'inventory.manage') then
    raise exception 'permission_denied';
  end if;
  if adjustment.status = 'reversed' then
    raise exception using errcode = '22023', message = 'adjustment_already_reversed';
  end if;
  if adjustment.status <> 'executed' then
    raise exception using errcode = '22023', message = 'adjustment_not_executed';
  end if;

  for movement in
    select *
    from public.inventory_movements
    where organization_id = adjustment.organization_id
      and source_type = 'stock_adjustment'
      and source_id = adjustment.id
      and movement_type = 'adjustment'
      and reverses_movement_id is null
    order by id
  loop
    before_quantity := private.current_inventory_on_hand(adjustment.organization_id, movement.sku_id, movement.location_id);
    after_quantity := before_quantity - movement.quantity_delta;
    if after_quantity < 0 then
      raise exception using errcode = '22023', message = 'insufficient_stock_for_reversal';
    end if;

    insert into public.inventory_movements (
      organization_id, sku_id, location_id, movement_type, source_type,
      source_id, quantity_delta, quantity_before, quantity_after,
      unit_cost, currency_code, reason, idempotency_key, correlation_id,
      reverses_movement_id, created_by
    ) values (
      adjustment.organization_id, movement.sku_id, movement.location_id,
      'adjustment', 'stock_adjustment', adjustment.id, -movement.quantity_delta,
      before_quantity, after_quantity, movement.unit_cost, movement.currency_code,
      trim(target_reversal_reason), trim(target_idempotency_key),
      adjustment.correlation_id, movement.id, actor_id
    );
  end loop;

  update public.stock_adjustments
  set status = 'reversed',
      reversed_by = actor_id,
      reversed_at = timezone('utc', now()),
      reversal_reason = trim(target_reversal_reason)
  where organization_id = adjustment.organization_id
    and id = adjustment.id;

  perform private.record_inventory_idempotency_result(
    adjustment.organization_id,
    'stock_adjustment_reverse',
    adjustment.id,
    target_idempotency_key,
    jsonb_build_object('adjustment_id', adjustment.id, 'status', 'reversed'),
    actor_id
  );

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    adjustment.organization_id, actor_id, 'stock_adjustment.reversed',
    'stock_adjustment', adjustment.id,
    jsonb_build_object('location_id', adjustment.location_id)
  );

  return adjustment.id;
end;
$$;

create or replace function public.approve_transfer_request(target_transfer_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  transfer public.transfer_requests%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select * into transfer
  from public.transfer_requests
  where id = target_transfer_id
  for update;

  if transfer.id is null
    or not private.has_location_permission(transfer.organization_id, transfer.origin_location_id, 'transfer.manage')
    or not private.has_location_permission(transfer.organization_id, transfer.destination_location_id, 'transfer.manage') then
    raise exception 'permission_denied';
  end if;
  if transfer.status in ('approved', 'picking', 'dispatched', 'in_transit', 'partially_received', 'received') then
    return transfer.id;
  end if;
  if transfer.status <> 'pending_approval' then
    raise exception using errcode = '22023', message = 'transfer_not_pending';
  end if;

  update public.transfer_items
  set approved_quantity = requested_quantity
  where organization_id = transfer.organization_id
    and transfer_request_id = transfer.id
    and approved_quantity is null;

  update public.transfer_requests
  set status = 'approved',
      approved_by = actor_id,
      approved_at = timezone('utc', now())
  where organization_id = transfer.organization_id
    and id = transfer.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    transfer.organization_id, actor_id, 'transfer_request.approved',
    'transfer_request', transfer.id,
    jsonb_build_object('origin_location_id', transfer.origin_location_id, 'destination_location_id', transfer.destination_location_id)
  );

  return transfer.id;
end;
$$;

create or replace function public.reject_transfer_request(
  target_transfer_id uuid,
  target_rejection_reason text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  transfer public.transfer_requests%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select * into transfer
  from public.transfer_requests
  where id = target_transfer_id
  for update;

  if transfer.id is null
    or not private.has_location_permission(transfer.organization_id, transfer.origin_location_id, 'transfer.manage')
    or not private.has_location_permission(transfer.organization_id, transfer.destination_location_id, 'transfer.manage') then
    raise exception 'permission_denied';
  end if;
  if transfer.status = 'rejected' then
    return transfer.id;
  end if;
  if transfer.status <> 'pending_approval' then
    raise exception using errcode = '22023', message = 'transfer_not_pending';
  end if;

  update public.transfer_requests
  set status = 'rejected',
      rejected_by = actor_id,
      rejected_at = timezone('utc', now()),
      rejection_reason = nullif(trim(coalesce(target_rejection_reason, '')), '')
  where organization_id = transfer.organization_id
    and id = transfer.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    transfer.organization_id, actor_id, 'transfer_request.rejected',
    'transfer_request', transfer.id,
    jsonb_build_object('origin_location_id', transfer.origin_location_id, 'destination_location_id', transfer.destination_location_id)
  );

  return transfer.id;
end;
$$;

create or replace function public.dispatch_transfer_request(
  target_transfer_id uuid,
  target_idempotency_key text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  transfer public.transfer_requests%rowtype;
  existing_result jsonb;
  item record;
  dispatch_quantity integer;
  before_quantity integer;
  after_quantity integer;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;
  if target_idempotency_key is null or char_length(trim(target_idempotency_key)) < 8 then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  select result into existing_result
  from public.inventory_operation_idempotency_keys
  where operation_type = 'transfer_dispatch'
    and source_id = target_transfer_id
    and idempotency_key = trim(target_idempotency_key)
  for update;
  if existing_result is not null then
    return (existing_result ->> 'transfer_id')::uuid;
  end if;

  lock table public.inventory_movements in share row exclusive mode;

  select * into transfer
  from public.transfer_requests
  where id = target_transfer_id
  for update;

  if transfer.id is null
    or not private.has_location_permission(transfer.organization_id, transfer.origin_location_id, 'transfer.manage')
    or not private.has_location_permission(transfer.organization_id, transfer.destination_location_id, 'transfer.manage') then
    raise exception 'permission_denied';
  end if;
  if transfer.status in ('dispatched', 'in_transit', 'partially_received', 'received') then
    raise exception using errcode = '22023', message = 'transfer_already_dispatched';
  end if;
  if transfer.status not in ('approved', 'picking') then
    raise exception using errcode = '22023', message = 'transfer_not_approved';
  end if;

  for item in
    select transfer_item.*, sku.approved_unit_cost, sku.currency_code
    from public.transfer_items transfer_item
    join public.skus sku
      on sku.organization_id = transfer_item.organization_id
     and sku.id = transfer_item.sku_id
    where transfer_item.organization_id = transfer.organization_id
      and transfer_item.transfer_request_id = transfer.id
    order by transfer_item.id
  loop
    dispatch_quantity := coalesce(item.approved_quantity, item.requested_quantity) - item.dispatched_quantity;
    if dispatch_quantity <= 0 then
      continue;
    end if;

    if private.current_inventory_available(transfer.organization_id, item.sku_id, transfer.origin_location_id) < dispatch_quantity then
      raise exception using errcode = '22023', message = 'insufficient_stock';
    end if;

    before_quantity := private.current_inventory_on_hand(transfer.organization_id, item.sku_id, transfer.origin_location_id);
    after_quantity := before_quantity - dispatch_quantity;
    if after_quantity < 0 then
      raise exception using errcode = '22023', message = 'insufficient_stock';
    end if;

    insert into public.inventory_movements (
      organization_id, sku_id, location_id, movement_type, source_type,
      source_id, quantity_delta, quantity_before, quantity_after,
      unit_cost, currency_code, reason, idempotency_key, correlation_id, created_by
    ) values (
      transfer.organization_id, item.sku_id, transfer.origin_location_id,
      'transfer_out', 'transfer_request', transfer.id, -dispatch_quantity,
      before_quantity, after_quantity, item.approved_unit_cost, item.currency_code,
      transfer.reason, trim(target_idempotency_key), transfer.correlation_id, actor_id
    );

    update public.transfer_items
    set dispatched_quantity = dispatched_quantity + dispatch_quantity
    where organization_id = transfer.organization_id
      and id = item.id;
  end loop;

  update public.transfer_requests
  set status = 'in_transit',
      dispatched_by = actor_id,
      dispatched_at = timezone('utc', now())
  where organization_id = transfer.organization_id
    and id = transfer.id;

  perform private.record_inventory_idempotency_result(
    transfer.organization_id,
    'transfer_dispatch',
    transfer.id,
    target_idempotency_key,
    jsonb_build_object('transfer_id', transfer.id, 'status', 'in_transit'),
    actor_id
  );

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    transfer.organization_id, actor_id, 'transfer_request.dispatched',
    'transfer_request', transfer.id,
    jsonb_build_object('origin_location_id', transfer.origin_location_id, 'destination_location_id', transfer.destination_location_id)
  );

  return transfer.id;
end;
$$;

create or replace function public.receive_transfer_request(
  target_transfer_id uuid,
  target_receipts jsonb,
  target_idempotency_key text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  transfer public.transfer_requests%rowtype;
  existing_result jsonb;
  receipt jsonb;
  item public.transfer_items%rowtype;
  receive_quantity integer;
  damage_quantity integer;
  before_quantity integer;
  after_quantity integer;
  remaining_quantity integer;
  total_dispatched integer;
  total_landed integer;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;
  if target_idempotency_key is null or char_length(trim(target_idempotency_key)) < 8 then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if jsonb_typeof(target_receipts) <> 'array' or jsonb_array_length(target_receipts) = 0 or jsonb_array_length(target_receipts) > 100 then
    raise exception using errcode = '22023', message = 'invalid_transfer_receipts';
  end if;

  select result into existing_result
  from public.inventory_operation_idempotency_keys
  where operation_type = 'transfer_receive'
    and source_id = target_transfer_id
    and idempotency_key = trim(target_idempotency_key)
  for update;
  if existing_result is not null then
    return (existing_result ->> 'transfer_id')::uuid;
  end if;

  lock table public.inventory_movements in share row exclusive mode;

  select * into transfer
  from public.transfer_requests
  where id = target_transfer_id
  for update;

  if transfer.id is null
    or not private.has_location_permission(transfer.organization_id, transfer.destination_location_id, 'transfer.manage') then
    raise exception 'permission_denied';
  end if;
  if transfer.status not in ('dispatched', 'in_transit', 'partially_received', 'exception') then
    raise exception using errcode = '22023', message = 'transfer_not_receivable';
  end if;

  for receipt in select value from jsonb_array_elements(target_receipts)
  loop
    select * into item
    from public.transfer_items
    where organization_id = transfer.organization_id
      and transfer_request_id = transfer.id
      and id = (receipt ->> 'transfer_item_id')::uuid
    for update;

    if item.id is null then
      raise exception using errcode = '22023', message = 'transfer_item_not_found';
    end if;

    receive_quantity := coalesce((receipt ->> 'received_quantity')::integer, 0);
    damage_quantity := coalesce((receipt ->> 'damaged_quantity')::integer, 0);
    if receive_quantity < 0 or damage_quantity < 0 or receive_quantity + damage_quantity <= 0 then
      raise exception using errcode = '22023', message = 'receipt_quantity_required';
    end if;
    if item.received_quantity + item.damaged_quantity + receive_quantity + damage_quantity > item.dispatched_quantity then
      raise exception using errcode = '22023', message = 'receipt_exceeds_dispatched';
    end if;

    if receive_quantity > 0 then
      before_quantity := private.current_inventory_on_hand(transfer.organization_id, item.sku_id, transfer.destination_location_id);
      after_quantity := before_quantity + receive_quantity;

      insert into public.inventory_movements (
        organization_id, sku_id, location_id, movement_type, source_type,
        source_id, quantity_delta, quantity_before, quantity_after,
        unit_cost, currency_code, reason, idempotency_key, correlation_id, created_by
      )
      select
        transfer.organization_id, item.sku_id, transfer.destination_location_id,
        'transfer_in', 'transfer_request', transfer.id, receive_quantity,
        before_quantity, after_quantity, sku.approved_unit_cost, sku.currency_code,
        transfer.reason, trim(target_idempotency_key), transfer.correlation_id, actor_id
      from public.skus sku
      where sku.organization_id = transfer.organization_id
        and sku.id = item.sku_id;
    end if;

    update public.transfer_items
    set received_quantity = received_quantity + receive_quantity,
        damaged_quantity = damaged_quantity + damage_quantity
    where organization_id = transfer.organization_id
      and id = item.id;

    select dispatched_quantity - received_quantity - damaged_quantity
    into remaining_quantity
    from public.transfer_items
    where organization_id = transfer.organization_id
      and id = item.id;

    if remaining_quantity > 0 then
      insert into public.transfer_discrepancies (
        organization_id, transfer_request_id, transfer_item_id, sku_id,
        discrepancy_type, expected_quantity, received_quantity, damaged_quantity,
        variance_quantity, status, created_by
      ) values (
        transfer.organization_id, transfer.id, item.id, item.sku_id,
        'short_receipt', item.dispatched_quantity, item.received_quantity + receive_quantity,
        item.damaged_quantity + damage_quantity, -remaining_quantity, 'open', actor_id
      )
      on conflict (organization_id, transfer_item_id, discrepancy_type)
      do update set
        expected_quantity = excluded.expected_quantity,
        received_quantity = excluded.received_quantity,
        damaged_quantity = excluded.damaged_quantity,
        variance_quantity = excluded.variance_quantity,
        status = 'open',
        resolved_by = null,
        resolved_at = null;
    else
      update public.transfer_discrepancies
      set status = 'resolved',
          resolved_by = actor_id,
          resolved_at = timezone('utc', now())
      where organization_id = transfer.organization_id
        and transfer_item_id = item.id
        and discrepancy_type = 'short_receipt'
        and status = 'open';
    end if;

    if damage_quantity > 0 then
      insert into public.transfer_discrepancies (
        organization_id, transfer_request_id, transfer_item_id, sku_id,
        discrepancy_type, expected_quantity, received_quantity, damaged_quantity,
        variance_quantity, status, created_by
      ) values (
        transfer.organization_id, transfer.id, item.id, item.sku_id,
        'damaged_in_transit', item.dispatched_quantity, item.received_quantity + receive_quantity,
        item.damaged_quantity + damage_quantity, -damage_quantity, 'open', actor_id
      )
      on conflict (organization_id, transfer_item_id, discrepancy_type)
      do update set
        damaged_quantity = excluded.damaged_quantity,
        variance_quantity = excluded.variance_quantity,
        status = 'open',
        resolved_by = null,
        resolved_at = null;
    end if;
  end loop;

  select
    coalesce(sum(dispatched_quantity), 0),
    coalesce(sum(received_quantity + damaged_quantity), 0)
  into total_dispatched, total_landed
  from public.transfer_items
  where organization_id = transfer.organization_id
    and transfer_request_id = transfer.id;

  update public.transfer_requests
  set status = case
        when total_dispatched > 0 and total_landed >= total_dispatched then 'received'
        when total_landed > 0 then 'partially_received'
        else 'in_transit'
      end,
      received_by = actor_id,
      received_at = case when total_dispatched > 0 and total_landed >= total_dispatched then timezone('utc', now()) else received_at end
  where organization_id = transfer.organization_id
    and id = transfer.id;

  perform private.record_inventory_idempotency_result(
    transfer.organization_id,
    'transfer_receive',
    transfer.id,
    target_idempotency_key,
    jsonb_build_object('transfer_id', transfer.id, 'status', case when total_landed >= total_dispatched then 'received' else 'partially_received' end),
    actor_id
  );

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    transfer.organization_id, actor_id, 'transfer_request.received',
    'transfer_request', transfer.id,
    jsonb_build_object('destination_location_id', transfer.destination_location_id, 'landed_quantity', total_landed, 'dispatched_quantity', total_dispatched)
  );

  return transfer.id;
end;
$$;

revoke all on function private.current_inventory_on_hand(uuid, uuid, uuid) from public;
revoke all on function private.current_inventory_available(uuid, uuid, uuid) from public;
revoke all on function private.record_inventory_idempotency_result(uuid, text, uuid, text, jsonb, uuid) from public;

revoke all on function public.reject_stock_adjustment(uuid, text) from public, anon;
revoke all on function public.execute_stock_adjustment(uuid, text) from public, anon;
revoke all on function public.reverse_stock_adjustment(uuid, text, text) from public, anon;
revoke all on function public.reject_transfer_request(uuid, text) from public, anon;
revoke all on function public.dispatch_transfer_request(uuid, text) from public, anon;
revoke all on function public.receive_transfer_request(uuid, jsonb, text) from public, anon;

grant execute on function public.reject_stock_adjustment(uuid, text) to authenticated;
grant execute on function public.execute_stock_adjustment(uuid, text) to authenticated;
grant execute on function public.reverse_stock_adjustment(uuid, text, text) to authenticated;
grant execute on function public.reject_transfer_request(uuid, text) to authenticated;
grant execute on function public.dispatch_transfer_request(uuid, text) to authenticated;
grant execute on function public.receive_transfer_request(uuid, jsonb, text) to authenticated;

comment on view public.current_inventory_balances is 'Phase 1 tenant/location-scoped current inventory balances derived from approved inventory snapshots plus the audited inventory movement ledger.';
comment on table public.inventory_operation_idempotency_keys is 'Phase 1 idempotency evidence for stock-affecting operations.';
comment on table public.transfer_discrepancies is 'Phase 1 transfer receiving discrepancy evidence for partial, short, or damaged receipt workflows.';

commit;
