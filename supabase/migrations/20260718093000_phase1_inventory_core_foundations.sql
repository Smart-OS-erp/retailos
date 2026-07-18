begin;

-- Phase 1 — Core Inventory Operating System foundations.
-- This migration is backend-only: no dashboards, no POS, no finance, no
-- warehouse-management feature expansion. It adds the first five inventory-core
-- milestones as tenant-scoped, permissioned, auditable database contracts.

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
      'intelligence.run','opportunity.view',
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
      'inventory.view','inventory.manage','transfer.manage','stock_count.manage',
      'intelligence.run','opportunity.view','project.view','project.manage',
      'task.view','task.manage','campaign_brief.view','campaign_brief.manage','copilot.use',
      'integration.view','integration.manage','integration.sync','integration.import'
    ])
    when 'store_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view',
      'inventory.view','inventory.manage','transfer.manage','stock_count.manage',
      'opportunity.view','project.view','task.view','task.manage','campaign_brief.view','copilot.use'
    ])
    when 'viewer' then required_permission = any (array[
      'organization.view','location.view','brand.view','data.view','inventory.view','opportunity.view',
      'project.view','task.view','campaign_brief.view','copilot.use'
    ])
    else false
  end;
$$;

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sku_id uuid not null,
  location_id uuid not null,
  movement_type text not null check (
    movement_type in ('adjustment', 'transfer_out', 'transfer_in', 'count_correction')
  ),
  source_type text not null check (
    source_type in ('stock_adjustment', 'transfer_request', 'stock_count')
  ),
  source_id uuid not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  unit_cost numeric(18, 4) check (unit_cost is null or unit_cost >= 0),
  currency_code text check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  occurred_at timestamptz not null default timezone('utc', now()),
  reason text check (reason is null or char_length(reason) <= 500),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create table public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null,
  status text not null default 'pending_approval' check (
    status in ('pending_approval', 'approved', 'rejected', 'cancelled')
  ),
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  requested_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create table public.stock_adjustment_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stock_adjustment_id uuid not null,
  sku_id uuid not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, stock_adjustment_id, sku_id),
  foreign key (organization_id, stock_adjustment_id) references public.stock_adjustments(organization_id, id) on delete cascade,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict
);

create table public.transfer_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  origin_location_id uuid not null,
  destination_location_id uuid not null,
  status text not null default 'pending_approval' check (
    status in ('pending_approval', 'approved', 'rejected', 'cancelled')
  ),
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  requested_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, origin_location_id) references public.locations(organization_id, id) on delete restrict,
  foreign key (organization_id, destination_location_id) references public.locations(organization_id, id) on delete restrict,
  check (origin_location_id <> destination_location_id)
);

create table public.transfer_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  transfer_request_id uuid not null,
  sku_id uuid not null,
  requested_quantity integer not null check (requested_quantity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, transfer_request_id, sku_id),
  foreign key (organization_id, transfer_request_id) references public.transfer_requests(organization_id, id) on delete cascade,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict
);

create table public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null,
  status text not null default 'submitted' check (
    status in ('submitted', 'reviewed', 'cancelled')
  ),
  counted_at timestamptz not null,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create table public.stock_count_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stock_count_id uuid not null,
  sku_id uuid not null,
  expected_quantity integer not null check (expected_quantity >= 0),
  counted_quantity integer not null check (counted_quantity >= 0),
  variance_quantity integer generated always as (counted_quantity - expected_quantity) stored,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, stock_count_id, sku_id),
  foreign key (organization_id, stock_count_id) references public.stock_counts(organization_id, id) on delete cascade,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict
);

create table public.reconciliation_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stock_count_id uuid not null,
  stock_count_item_id uuid not null,
  location_id uuid not null,
  sku_id uuid not null,
  issue_type text not null default 'stock_variance' check (issue_type = 'stock_variance'),
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  variance_quantity integer not null check (variance_quantity <> 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  resolved_by uuid references auth.users(id) on delete restrict,
  resolved_at timestamptz,
  unique (organization_id, id),
  unique (organization_id, stock_count_item_id),
  foreign key (organization_id, stock_count_id) references public.stock_counts(organization_id, id) on delete cascade,
  foreign key (organization_id, stock_count_item_id) references public.stock_count_items(organization_id, id) on delete cascade,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict
);

create index inventory_movements_location_idx on public.inventory_movements (organization_id, location_id, occurred_at desc);
create index inventory_movements_sku_idx on public.inventory_movements (organization_id, sku_id, occurred_at desc);
create index stock_adjustments_location_idx on public.stock_adjustments (organization_id, location_id, status, created_at desc);
create index transfer_requests_origin_idx on public.transfer_requests (organization_id, origin_location_id, status, created_at desc);
create index transfer_requests_destination_idx on public.transfer_requests (organization_id, destination_location_id, status, created_at desc);
create index stock_counts_location_idx on public.stock_counts (organization_id, location_id, counted_at desc);
create index reconciliation_issues_location_idx on public.reconciliation_issues (organization_id, location_id, status, created_at desc);

create trigger stock_adjustments_set_updated_at
before update on public.stock_adjustments
for each row execute function private.set_updated_at();

create trigger transfer_requests_set_updated_at
before update on public.transfer_requests
for each row execute function private.set_updated_at();

create trigger stock_counts_set_updated_at
before update on public.stock_counts
for each row execute function private.set_updated_at();

alter table public.inventory_movements enable row level security;
alter table public.inventory_movements force row level security;
alter table public.stock_adjustments enable row level security;
alter table public.stock_adjustments force row level security;
alter table public.stock_adjustment_items enable row level security;
alter table public.stock_adjustment_items force row level security;
alter table public.transfer_requests enable row level security;
alter table public.transfer_requests force row level security;
alter table public.transfer_items enable row level security;
alter table public.transfer_items force row level security;
alter table public.stock_counts enable row level security;
alter table public.stock_counts force row level security;
alter table public.stock_count_items enable row level security;
alter table public.stock_count_items force row level security;
alter table public.reconciliation_issues enable row level security;
alter table public.reconciliation_issues force row level security;

create policy inventory_movements_select on public.inventory_movements
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'inventory.view'));

create policy stock_adjustments_select on public.stock_adjustments
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'inventory.view'));

create policy stock_adjustment_items_select on public.stock_adjustment_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.stock_adjustments adjustment
      where adjustment.organization_id = stock_adjustment_items.organization_id
        and adjustment.id = stock_adjustment_items.stock_adjustment_id
        and private.has_location_permission(adjustment.organization_id, adjustment.location_id, 'inventory.view')
    )
  );

create policy transfer_requests_select on public.transfer_requests
  for select to authenticated
  using (
    private.has_location_permission(organization_id, origin_location_id, 'inventory.view')
    or private.has_location_permission(organization_id, destination_location_id, 'inventory.view')
  );

create policy transfer_items_select on public.transfer_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.transfer_requests transfer
      where transfer.organization_id = transfer_items.organization_id
        and transfer.id = transfer_items.transfer_request_id
        and (
          private.has_location_permission(transfer.organization_id, transfer.origin_location_id, 'inventory.view')
          or private.has_location_permission(transfer.organization_id, transfer.destination_location_id, 'inventory.view')
        )
    )
  );

create policy stock_counts_select on public.stock_counts
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'inventory.view'));

create policy stock_count_items_select on public.stock_count_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.stock_counts count_header
      where count_header.organization_id = stock_count_items.organization_id
        and count_header.id = stock_count_items.stock_count_id
        and private.has_location_permission(count_header.organization_id, count_header.location_id, 'inventory.view')
    )
  );

create policy reconciliation_issues_select on public.reconciliation_issues
  for select to authenticated
  using (private.has_location_permission(organization_id, location_id, 'inventory.view'));

revoke all on table public.inventory_movements from anon, authenticated;
revoke all on table public.stock_adjustments from anon, authenticated;
revoke all on table public.stock_adjustment_items from anon, authenticated;
revoke all on table public.transfer_requests from anon, authenticated;
revoke all on table public.transfer_items from anon, authenticated;
revoke all on table public.stock_counts from anon, authenticated;
revoke all on table public.stock_count_items from anon, authenticated;
revoke all on table public.reconciliation_issues from anon, authenticated;

grant select on table public.inventory_movements to authenticated;
grant select on table public.stock_adjustments to authenticated;
grant select on table public.stock_adjustment_items to authenticated;
grant select on table public.transfer_requests to authenticated;
grant select on table public.transfer_items to authenticated;
grant select on table public.stock_counts to authenticated;
grant select on table public.stock_count_items to authenticated;
grant select on table public.reconciliation_issues to authenticated;

create or replace function private.validate_phase1_sku(
  target_organization_id uuid,
  target_sku_id uuid
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.skus
    where organization_id = target_organization_id
      and id = target_sku_id
  ) then
    raise exception using errcode = '22023', message = 'sku_not_found';
  end if;
end;
$$;

create or replace function public.create_stock_adjustment(
  target_location_id uuid,
  target_reason text,
  target_items jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_organization_id uuid;
  adjustment_id uuid := gen_random_uuid();
  item jsonb;
  sku_value uuid;
  quantity_delta_value integer;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select organization_id into target_organization_id
  from public.locations
  where id = target_location_id;

  if target_organization_id is null
    or not private.has_location_permission(target_organization_id, target_location_id, 'inventory.manage') then
    raise exception 'permission_denied';
  end if;
  if target_reason is null or char_length(trim(target_reason)) < 3 then
    raise exception using errcode = '22023', message = 'reason_required';
  end if;
  if jsonb_typeof(target_items) <> 'array' or jsonb_array_length(target_items) = 0 or jsonb_array_length(target_items) > 100 then
    raise exception using errcode = '22023', message = 'invalid_adjustment_items';
  end if;

  insert into public.stock_adjustments (
    id, organization_id, location_id, reason, requested_by
  ) values (
    adjustment_id, target_organization_id, target_location_id, trim(target_reason), actor_id
  );

  for item in select value from jsonb_array_elements(target_items)
  loop
    sku_value := (item ->> 'sku_id')::uuid;
    quantity_delta_value := (item ->> 'quantity_delta')::integer;
    if quantity_delta_value = 0 then
      raise exception using errcode = '22023', message = 'quantity_delta_required';
    end if;
    perform private.validate_phase1_sku(target_organization_id, sku_value);

    insert into public.stock_adjustment_items (
      organization_id, stock_adjustment_id, sku_id, quantity_delta, reason
    ) values (
      target_organization_id,
      adjustment_id,
      sku_value,
      quantity_delta_value,
      nullif(trim(item ->> 'reason'), '')
    );
  end loop;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id, actor_id, 'stock_adjustment.requested',
    'stock_adjustment', adjustment_id,
    jsonb_build_object('location_id', target_location_id)
  );

  return adjustment_id;
end;
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
  item record;
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
  if adjustment.status <> 'pending_approval' then
    raise exception using errcode = '22023', message = 'adjustment_not_pending';
  end if;

  update public.stock_adjustments
  set status = 'approved',
      approved_by = actor_id,
      approved_at = timezone('utc', now())
  where organization_id = adjustment.organization_id
    and id = adjustment.id;

  for item in
    select adjustment_item.*, sku.approved_unit_cost, sku.currency_code
    from public.stock_adjustment_items adjustment_item
    join public.skus sku
      on sku.organization_id = adjustment_item.organization_id
     and sku.id = adjustment_item.sku_id
    where adjustment_item.organization_id = adjustment.organization_id
      and adjustment_item.stock_adjustment_id = adjustment.id
  loop
    insert into public.inventory_movements (
      organization_id, sku_id, location_id, movement_type, source_type,
      source_id, quantity_delta, unit_cost, currency_code, reason, created_by
    ) values (
      adjustment.organization_id, item.sku_id, adjustment.location_id,
      'adjustment', 'stock_adjustment', adjustment.id, item.quantity_delta,
      item.approved_unit_cost, item.currency_code,
      coalesce(item.reason, adjustment.reason), actor_id
    );
  end loop;

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

create or replace function public.create_transfer_request(
  origin_location_id uuid,
  destination_location_id uuid,
  target_reason text,
  target_items jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_organization_id uuid;
  destination_organization_id uuid;
  transfer_id uuid := gen_random_uuid();
  item jsonb;
  sku_value uuid;
  quantity_value integer;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;
  if origin_location_id = destination_location_id then
    raise exception using errcode = '22023', message = 'transfer_locations_must_differ';
  end if;

  select organization_id into target_organization_id from public.locations where id = origin_location_id;
  select organization_id into destination_organization_id from public.locations where id = destination_location_id;

  if target_organization_id is null
    or destination_organization_id is distinct from target_organization_id
    or not private.has_location_permission(target_organization_id, origin_location_id, 'transfer.manage')
    or not private.has_location_permission(target_organization_id, destination_location_id, 'transfer.manage') then
    raise exception 'permission_denied';
  end if;
  if target_reason is null or char_length(trim(target_reason)) < 3 then
    raise exception using errcode = '22023', message = 'reason_required';
  end if;
  if jsonb_typeof(target_items) <> 'array' or jsonb_array_length(target_items) = 0 or jsonb_array_length(target_items) > 100 then
    raise exception using errcode = '22023', message = 'invalid_transfer_items';
  end if;

  insert into public.transfer_requests (
    id, organization_id, origin_location_id, destination_location_id, reason, requested_by
  ) values (
    transfer_id, target_organization_id, origin_location_id, destination_location_id, trim(target_reason), actor_id
  );

  for item in select value from jsonb_array_elements(target_items)
  loop
    sku_value := (item ->> 'sku_id')::uuid;
    quantity_value := (item ->> 'quantity')::integer;
    if quantity_value <= 0 then
      raise exception using errcode = '22023', message = 'transfer_quantity_required';
    end if;
    perform private.validate_phase1_sku(target_organization_id, sku_value);

    insert into public.transfer_items (
      organization_id, transfer_request_id, sku_id, requested_quantity
    ) values (
      target_organization_id, transfer_id, sku_value, quantity_value
    );
  end loop;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id, actor_id, 'transfer_request.requested',
    'transfer_request', transfer_id,
    jsonb_build_object('origin_location_id', origin_location_id, 'destination_location_id', destination_location_id)
  );

  return transfer_id;
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
  item record;
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
  if transfer.status <> 'pending_approval' then
    raise exception using errcode = '22023', message = 'transfer_not_pending';
  end if;

  update public.transfer_requests
  set status = 'approved',
      approved_by = actor_id,
      approved_at = timezone('utc', now())
  where organization_id = transfer.organization_id
    and id = transfer.id;

  for item in
    select transfer_item.*, sku.approved_unit_cost, sku.currency_code
    from public.transfer_items transfer_item
    join public.skus sku
      on sku.organization_id = transfer_item.organization_id
     and sku.id = transfer_item.sku_id
    where transfer_item.organization_id = transfer.organization_id
      and transfer_item.transfer_request_id = transfer.id
  loop
    insert into public.inventory_movements (
      organization_id, sku_id, location_id, movement_type, source_type,
      source_id, quantity_delta, unit_cost, currency_code, reason, created_by
    ) values
      (
        transfer.organization_id, item.sku_id, transfer.origin_location_id,
        'transfer_out', 'transfer_request', transfer.id,
        -item.requested_quantity, item.approved_unit_cost, item.currency_code,
        transfer.reason, actor_id
      ),
      (
        transfer.organization_id, item.sku_id, transfer.destination_location_id,
        'transfer_in', 'transfer_request', transfer.id,
        item.requested_quantity, item.approved_unit_cost, item.currency_code,
        transfer.reason, actor_id
      );
  end loop;

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

create or replace function public.submit_stock_count(
  target_location_id uuid,
  target_counted_at timestamptz,
  target_items jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_organization_id uuid;
  count_id uuid := gen_random_uuid();
  count_item_id uuid;
  item jsonb;
  sku_value uuid;
  expected_value integer;
  counted_value integer;
  variance_value integer;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select organization_id into target_organization_id
  from public.locations
  where id = target_location_id;

  if target_organization_id is null
    or not private.has_location_permission(target_organization_id, target_location_id, 'stock_count.manage') then
    raise exception 'permission_denied';
  end if;
  if jsonb_typeof(target_items) <> 'array' or jsonb_array_length(target_items) = 0 or jsonb_array_length(target_items) > 500 then
    raise exception using errcode = '22023', message = 'invalid_stock_count_items';
  end if;

  insert into public.stock_counts (
    id, organization_id, location_id, counted_at, submitted_by
  ) values (
    count_id, target_organization_id, target_location_id,
    coalesce(target_counted_at, timezone('utc', now())), actor_id
  );

  for item in select value from jsonb_array_elements(target_items)
  loop
    sku_value := (item ->> 'sku_id')::uuid;
    expected_value := (item ->> 'expected_quantity')::integer;
    counted_value := (item ->> 'counted_quantity')::integer;
    if expected_value < 0 or counted_value < 0 then
      raise exception using errcode = '22023', message = 'stock_count_quantity_invalid';
    end if;
    perform private.validate_phase1_sku(target_organization_id, sku_value);
    variance_value := counted_value - expected_value;

    insert into public.stock_count_items (
      organization_id, stock_count_id, sku_id, expected_quantity, counted_quantity
    ) values (
      target_organization_id, count_id, sku_value, expected_value, counted_value
    )
    returning id into count_item_id;

    if variance_value <> 0 then
      insert into public.reconciliation_issues (
        organization_id, stock_count_id, stock_count_item_id, location_id,
        sku_id, severity, variance_quantity, created_by
      ) values (
        target_organization_id, count_id, count_item_id, target_location_id,
        sku_value,
        case
          when abs(variance_value) >= 10 then 'high'
          when abs(variance_value) >= 3 then 'medium'
          else 'low'
        end,
        variance_value,
        actor_id
      );
    end if;
  end loop;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id, actor_id, 'stock_count.submitted',
    'stock_count', count_id,
    jsonb_build_object('location_id', target_location_id)
  );

  return count_id;
end;
$$;

create or replace function public.search_inventory_items(
  search_term text,
  target_location_id uuid default null,
  result_limit integer default 25
)
returns table (
  sku_id uuid,
  sku_code text,
  barcode text,
  product_name text,
  location_id uuid,
  location_name text,
  on_hand_quantity integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    sku.id as sku_id,
    sku.sku_code,
    sku.barcode,
    product.name as product_name,
    location.id as location_id,
    location.name as location_name,
    position.on_hand_quantity
  from public.inventory_snapshots snapshot
  join public.inventory_positions position
    on position.organization_id = snapshot.organization_id
   and position.snapshot_id = snapshot.id
  join public.skus sku
    on sku.organization_id = position.organization_id
   and sku.id = position.sku_id
  join public.products product
    on product.organization_id = sku.organization_id
   and product.id = sku.product_id
  join public.locations location
    on location.organization_id = position.organization_id
   and location.id = position.location_id
  where snapshot.status = 'approved'
    and char_length(trim(coalesce(search_term, ''))) >= 1
    and (target_location_id is null or position.location_id = target_location_id)
    and private.has_location_permission(position.organization_id, position.location_id, 'inventory.view')
    and (
      lower(sku.sku_code) like '%' || lower(trim(search_term)) || '%'
      or lower(coalesce(sku.barcode, '')) like '%' || lower(trim(search_term)) || '%'
      or lower(product.name) like '%' || lower(trim(search_term)) || '%'
    )
  order by sku.sku_code, location.name
  limit least(greatest(coalesce(result_limit, 25), 1), 50);
$$;

revoke all on function private.validate_phase1_sku(uuid, uuid) from public;
revoke all on function public.create_stock_adjustment(uuid, text, jsonb) from public, anon;
revoke all on function public.approve_stock_adjustment(uuid) from public, anon;
revoke all on function public.create_transfer_request(uuid, uuid, text, jsonb) from public, anon;
revoke all on function public.approve_transfer_request(uuid) from public, anon;
revoke all on function public.submit_stock_count(uuid, timestamptz, jsonb) from public, anon;
revoke all on function public.search_inventory_items(text, uuid, integer) from public, anon;

grant execute on function public.create_stock_adjustment(uuid, text, jsonb) to authenticated;
grant execute on function public.approve_stock_adjustment(uuid) to authenticated;
grant execute on function public.create_transfer_request(uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.approve_transfer_request(uuid) to authenticated;
grant execute on function public.submit_stock_count(uuid, timestamptz, jsonb) to authenticated;
grant execute on function public.search_inventory_items(text, uuid, integer) to authenticated;

comment on table public.inventory_movements is 'Phase 1 tenant-scoped inventory movement ledger. It records approved operational movements without implementing POS, finance, or warehouse management.';
comment on table public.stock_adjustments is 'Phase 1 stock adjustment request and approval headers.';
comment on table public.transfer_requests is 'Phase 1 transfer request and approval headers.';
comment on table public.stock_counts is 'Phase 1 store stock count headers.';
comment on table public.reconciliation_issues is 'Phase 1 stock-count variance and reconciliation issue evidence.';

commit;
