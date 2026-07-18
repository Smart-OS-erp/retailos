begin;

-- Phase 1 visible workflow acceptance.
-- Adds a saved watchlist overlay for persisted inventory positions so users can
-- add/remove watchlist items without changing the derived low/overstock alert
-- model. No forecasting, POS, procurement, finance, or Phase 2 scope.

create table if not exists public.inventory_watchlist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null,
  sku_id uuid not null,
  watch_status text not null default 'manual' check (
    watch_status in ('manual', 'out_of_stock', 'low_stock', 'overstock', 'in_transit')
  ),
  note text check (note is null or char_length(note) <= 1000),
  created_by uuid not null references auth.users(id) on delete restrict,
  removed_at timestamptz,
  removed_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict
);

create unique index if not exists inventory_watchlist_items_active_unique
  on public.inventory_watchlist_items (organization_id, location_id, sku_id, created_by)
  where removed_at is null;

create index if not exists inventory_watchlist_items_location_idx
  on public.inventory_watchlist_items (organization_id, location_id, removed_at, created_at desc);

drop trigger if exists inventory_watchlist_items_set_updated_at on public.inventory_watchlist_items;
create trigger inventory_watchlist_items_set_updated_at
before update on public.inventory_watchlist_items
for each row execute function private.set_updated_at();

alter table public.inventory_watchlist_items enable row level security;
alter table public.inventory_watchlist_items force row level security;

drop policy if exists inventory_watchlist_items_select on public.inventory_watchlist_items;
create policy inventory_watchlist_items_select on public.inventory_watchlist_items
  for select to authenticated
  using (
    removed_at is null
    and private.has_location_permission(organization_id, location_id, 'inventory.view')
  );

revoke all on table public.inventory_watchlist_items from anon, authenticated;
grant select on table public.inventory_watchlist_items to authenticated;

create or replace view public.inventory_saved_watchlist
with (security_invoker = true)
as
select
  item.id,
  item.organization_id,
  item.location_id,
  location.name as location_name,
  location.code as location_code,
  item.sku_id,
  sku.sku_code,
  sku.barcode,
  product.name as product_name,
  item.watch_status,
  item.note,
  item.created_by,
  item.created_at,
  item.updated_at
from public.inventory_watchlist_items item
join public.locations location
  on location.organization_id = item.organization_id
 and location.id = item.location_id
join public.skus sku
  on sku.organization_id = item.organization_id
 and sku.id = item.sku_id
join public.products product
  on product.organization_id = sku.organization_id
 and product.id = sku.product_id
where item.removed_at is null;

revoke all on table public.inventory_saved_watchlist from anon, authenticated;
grant select on table public.inventory_saved_watchlist to authenticated;

create or replace function public.add_inventory_watchlist_item(
  target_location_id uuid,
  target_sku_id uuid,
  target_watch_status text default 'manual',
  target_note text default null
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
  watchlist_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select location.organization_id into target_organization_id
  from public.locations location
  where location.id = target_location_id;

  if target_organization_id is null
    or not private.has_location_permission(target_organization_id, target_location_id, 'inventory.manage') then
    raise exception 'permission_denied';
  end if;

  perform private.validate_phase1_sku(target_organization_id, target_sku_id);

  if target_watch_status not in ('manual', 'out_of_stock', 'low_stock', 'overstock', 'in_transit') then
    raise exception using errcode = '22023', message = 'invalid_watch_status';
  end if;

  insert into public.inventory_watchlist_items (
    organization_id, location_id, sku_id, watch_status, note, created_by
  ) values (
    target_organization_id,
    target_location_id,
    target_sku_id,
    coalesce(nullif(trim(target_watch_status), ''), 'manual'),
    nullif(trim(coalesce(target_note, '')), ''),
    actor_id
  )
  on conflict (organization_id, location_id, sku_id, created_by)
  where removed_at is null
  do update set
    watch_status = excluded.watch_status,
    note = excluded.note,
    updated_at = timezone('utc', now())
  returning id into watchlist_id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    target_organization_id, actor_id, 'inventory_watchlist_item.added',
    'inventory_watchlist_item', watchlist_id,
    jsonb_build_object(
      'location_id', target_location_id,
      'sku_id', target_sku_id,
      'watch_status', coalesce(nullif(trim(target_watch_status), ''), 'manual')
    )
  );

  return watchlist_id;
end;
$$;

create or replace function public.remove_inventory_watchlist_item(
  target_watchlist_item_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  watchlist_item public.inventory_watchlist_items%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select * into watchlist_item
  from public.inventory_watchlist_items
  where id = target_watchlist_item_id
  for update;

  if watchlist_item.id is null
    or watchlist_item.removed_at is not null
    or watchlist_item.created_by is distinct from actor_id
    or not private.has_location_permission(watchlist_item.organization_id, watchlist_item.location_id, 'inventory.manage') then
    raise exception 'permission_denied';
  end if;

  update public.inventory_watchlist_items
  set removed_at = timezone('utc', now()),
      removed_by = actor_id
  where organization_id = watchlist_item.organization_id
    and id = watchlist_item.id;

  insert into public.audit_events (
    organization_id, actor_user_id, action, target_type, target_id, metadata
  ) values (
    watchlist_item.organization_id, actor_id, 'inventory_watchlist_item.removed',
    'inventory_watchlist_item', watchlist_item.id,
    jsonb_build_object(
      'location_id', watchlist_item.location_id,
      'sku_id', watchlist_item.sku_id
    )
  );

  return watchlist_item.id;
end;
$$;

revoke all on function public.add_inventory_watchlist_item(uuid, uuid, text, text) from public, anon;
revoke all on function public.remove_inventory_watchlist_item(uuid) from public, anon;
grant execute on function public.add_inventory_watchlist_item(uuid, uuid, text, text) to authenticated;
grant execute on function public.remove_inventory_watchlist_item(uuid) to authenticated;

comment on table public.inventory_watchlist_items is 'Phase 1 user-saved inventory watchlist overlay for persisted SKU/location positions.';
comment on view public.inventory_saved_watchlist is 'Phase 1 visible saved watchlist read model; derived alert watchlist remains separate and non-forecasting.';

commit;
