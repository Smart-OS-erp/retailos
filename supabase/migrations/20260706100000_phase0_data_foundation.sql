begin;

-- Phase 0 Milestone 2: tenant-scoped intake, staging, validation, and
-- canonical inventory facts. Later milestones deliberately live elsewhere.

create table public.entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  entity_type text not null default 'retailer' check (entity_type in ('retailer', 'brand_owner')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, name)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid,
  category_id uuid,
  name text not null check (char_length(trim(name)) between 2 and 160),
  style_code text not null check (char_length(style_code) between 1 and 80),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, style_code),
  foreign key (organization_id, brand_id) references public.brands(organization_id, id) on delete restrict,
  foreign key (organization_id, category_id) references public.categories(organization_id, id) on delete restrict
);

create table public.skus (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null,
  sku_code text not null check (char_length(sku_code) between 1 and 100),
  size text,
  color text,
  barcode text,
  approved_unit_cost numeric(18, 4) check (approved_unit_cost is null or approved_unit_cost >= 0),
  currency_code text check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, sku_code),
  foreign key (organization_id, product_id) references public.products(organization_id, id) on delete cascade
);

create table public.data_uploads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  upload_type text not null check (upload_type in ('sample', 'inventory_csv', 'sales_csv', 'product_csv', 'store_csv')),
  file_name text not null check (char_length(file_name) between 1 and 180),
  content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[a-f0-9]{64}$'),
  byte_size integer not null default 0 check (byte_size between 0 and 2097152),
  row_count integer not null default 0 check (row_count between 0 and 10000),
  status text not null default 'received' check (status in ('received', 'parsed', 'validation_blocked', 'ready', 'consolidated', 'failed')),
  warnings_accepted_at timestamptz,
  warnings_accepted_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, content_sha256)
);

create table public.raw_upload_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  upload_id uuid not null,
  row_number integer not null check (row_number between 1 and 10000),
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, upload_id, row_number),
  foreign key (organization_id, upload_id) references public.data_uploads(organization_id, id) on delete cascade
);

create table public.staging_inventory_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  upload_id uuid not null,
  raw_row_id uuid not null,
  location_id uuid,
  sku_code text,
  product_name text,
  location_code text,
  on_hand_quantity integer,
  approved_unit_cost numeric(18, 4),
  currency_code text,
  first_available_at date,
  units_sold_90 integer,
  units_sold_30 integer,
  validation_status text not null default 'pending' check (validation_status in ('pending', 'blocked', 'warning', 'valid')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, upload_id, raw_row_id),
  foreign key (organization_id, upload_id) references public.data_uploads(organization_id, id) on delete cascade,
  foreign key (organization_id, raw_row_id) references public.raw_upload_rows(organization_id, id) on delete cascade,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict,
  check (on_hand_quantity is null or on_hand_quantity >= 0),
  check (approved_unit_cost is null or approved_unit_cost >= 0),
  check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  check (units_sold_90 is null or units_sold_90 >= 0),
  check (units_sold_30 is null or units_sold_30 >= 0)
);

create table public.validation_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  upload_id uuid not null,
  staging_row_id uuid,
  severity text not null check (severity in ('blocking', 'warning', 'info')),
  issue_code text not null check (char_length(issue_code) between 3 and 80),
  message text not null check (char_length(message) between 3 and 500),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, upload_id) references public.data_uploads(organization_id, id) on delete cascade,
  foreign key (organization_id, staging_row_id) references public.staging_inventory_rows(organization_id, id) on delete cascade,
  check (severity <> 'blocking' or accepted_at is null)
);

create table public.inventory_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  upload_id uuid not null,
  observed_at timestamptz not null,
  status text not null default 'approved' check (status in ('approved', 'superseded')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  foreign key (organization_id, upload_id) references public.data_uploads(organization_id, id) on delete restrict
);

create table public.inventory_positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  sku_id uuid not null,
  location_id uuid not null,
  on_hand_quantity integer not null check (on_hand_quantity >= 0),
  approved_unit_cost numeric(18, 4) check (approved_unit_cost is null or approved_unit_cost >= 0),
  currency_code text check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  first_available_at date,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, snapshot_id, sku_id, location_id),
  foreign key (organization_id, snapshot_id) references public.inventory_snapshots(organization_id, id) on delete cascade,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create table public.sales_facts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  upload_id uuid not null,
  sku_id uuid not null,
  location_id uuid not null,
  sold_at timestamptz not null,
  quantity integer not null check (quantity > 0),
  gross_amount numeric(18, 4) check (gross_amount is null or gross_amount >= 0),
  currency_code text check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  source_record_key text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique nulls not distinct (organization_id, upload_id, source_record_key),
  foreign key (organization_id, upload_id) references public.data_uploads(organization_id, id) on delete restrict,
  foreign key (organization_id, sku_id) references public.skus(organization_id, id) on delete restrict,
  foreign key (organization_id, location_id) references public.locations(organization_id, id) on delete restrict
);

create index data_uploads_org_created_idx on public.data_uploads (organization_id, created_at desc);
create index validation_issues_upload_idx on public.validation_issues (organization_id, upload_id, severity);
create index inventory_positions_location_idx on public.inventory_positions (organization_id, location_id, snapshot_id);
create index sales_facts_window_idx on public.sales_facts (organization_id, location_id, sold_at desc);

create trigger entities_set_updated_at before update on public.entities for each row execute function private.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function private.set_updated_at();
create trigger skus_set_updated_at before update on public.skus for each row execute function private.set_updated_at();
create trigger data_uploads_set_updated_at before update on public.data_uploads for each row execute function private.set_updated_at();
create trigger staging_inventory_rows_set_updated_at before update on public.staging_inventory_rows for each row execute function private.set_updated_at();

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
      'data.view','data.manage','inventory.view'
    ])
    when 'executive' then required_permission = any (array[
      'organization.view','members.view','audit.view','location.view','brand.view','onboarding.view','event.view',
      'data.view','inventory.view'
    ])
    when 'merchandising_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','brand.manage','data.view','data.manage','inventory.view'
    ])
    when 'store_manager' then required_permission = any (array[
      'organization.view','location.view','brand.view','inventory.view'
    ])
    when 'viewer' then required_permission = any (array[
      'organization.view','location.view','brand.view','data.view','inventory.view'
    ])
    else false
  end;
$$;

alter table public.entities enable row level security;
alter table public.entities force row level security;
alter table public.categories enable row level security;
alter table public.categories force row level security;
alter table public.products enable row level security;
alter table public.products force row level security;
alter table public.skus enable row level security;
alter table public.skus force row level security;
alter table public.data_uploads enable row level security;
alter table public.data_uploads force row level security;
alter table public.raw_upload_rows enable row level security;
alter table public.raw_upload_rows force row level security;
alter table public.staging_inventory_rows enable row level security;
alter table public.staging_inventory_rows force row level security;
alter table public.validation_issues enable row level security;
alter table public.validation_issues force row level security;
alter table public.inventory_snapshots enable row level security;
alter table public.inventory_snapshots force row level security;
alter table public.inventory_positions enable row level security;
alter table public.inventory_positions force row level security;
alter table public.sales_facts enable row level security;
alter table public.sales_facts force row level security;

create policy entities_select on public.entities for select to authenticated using (private.has_permission(organization_id, 'data.view'));
create policy entities_insert on public.entities for insert to authenticated with check (private.has_permission(organization_id, 'data.manage') and created_by = (select auth.uid()));
create policy entities_update on public.entities for update to authenticated using (private.has_permission(organization_id, 'data.manage')) with check (private.has_permission(organization_id, 'data.manage'));
create policy categories_select on public.categories for select to authenticated using (private.has_permission(organization_id, 'data.view'));
create policy categories_insert on public.categories for insert to authenticated with check (private.has_permission(organization_id, 'data.manage') and created_by = (select auth.uid()));
create policy categories_update on public.categories for update to authenticated using (private.has_permission(organization_id, 'data.manage')) with check (private.has_permission(organization_id, 'data.manage'));
create policy products_select on public.products for select to authenticated using (private.has_permission(organization_id, 'data.view'));
create policy products_insert on public.products for insert to authenticated with check (private.has_permission(organization_id, 'data.manage') and created_by = (select auth.uid()));
create policy products_update on public.products for update to authenticated using (private.has_permission(organization_id, 'data.manage')) with check (private.has_permission(organization_id, 'data.manage'));
create policy skus_select on public.skus for select to authenticated using (private.has_permission(organization_id, 'data.view'));
create policy skus_insert on public.skus for insert to authenticated with check (private.has_permission(organization_id, 'data.manage') and created_by = (select auth.uid()));
create policy skus_update on public.skus for update to authenticated using (private.has_permission(organization_id, 'data.manage')) with check (private.has_permission(organization_id, 'data.manage'));
create policy data_uploads_select on public.data_uploads for select to authenticated using (private.has_permission(organization_id, 'data.view'));
create policy data_uploads_insert on public.data_uploads for insert to authenticated with check (private.has_permission(organization_id, 'data.manage') and created_by = (select auth.uid()));
create policy data_uploads_update on public.data_uploads for update to authenticated using (private.has_permission(organization_id, 'data.manage')) with check (private.has_permission(organization_id, 'data.manage'));
create policy raw_upload_rows_select on public.raw_upload_rows for select to authenticated using (private.has_permission(organization_id, 'data.view'));
create policy raw_upload_rows_insert on public.raw_upload_rows for insert to authenticated with check (private.has_permission(organization_id, 'data.manage'));
create policy staging_inventory_rows_select on public.staging_inventory_rows for select to authenticated using (private.has_permission(organization_id, 'data.view'));
create policy staging_inventory_rows_insert on public.staging_inventory_rows for insert to authenticated with check (private.has_permission(organization_id, 'data.manage'));
create policy staging_inventory_rows_update on public.staging_inventory_rows for update to authenticated using (private.has_permission(organization_id, 'data.manage')) with check (private.has_permission(organization_id, 'data.manage'));
create policy validation_issues_select on public.validation_issues for select to authenticated using (private.has_permission(organization_id, 'data.view'));
create policy validation_issues_insert on public.validation_issues for insert to authenticated with check (private.has_permission(organization_id, 'data.manage'));
create policy validation_issues_update on public.validation_issues for update to authenticated using (private.has_permission(organization_id, 'data.manage')) with check (private.has_permission(organization_id, 'data.manage'));
create policy inventory_snapshots_select on public.inventory_snapshots for select to authenticated using (private.has_permission(organization_id, 'inventory.view'));
create policy inventory_positions_select on public.inventory_positions for select to authenticated using (private.has_location_permission(organization_id, location_id, 'inventory.view'));
create policy sales_facts_select on public.sales_facts for select to authenticated using (private.has_location_permission(organization_id, location_id, 'inventory.view'));

revoke all on table public.entities from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.skus from anon, authenticated;
revoke all on table public.data_uploads from anon, authenticated;
revoke all on table public.raw_upload_rows from anon, authenticated;
revoke all on table public.staging_inventory_rows from anon, authenticated;
revoke all on table public.validation_issues from anon, authenticated;
revoke all on table public.inventory_snapshots from anon, authenticated;
revoke all on table public.inventory_positions from anon, authenticated;
revoke all on table public.sales_facts from anon, authenticated;

grant select, insert on table public.entities to authenticated;
grant update (name, entity_type, updated_at) on table public.entities to authenticated;
grant select, insert on table public.categories to authenticated;
grant update (name, updated_at) on table public.categories to authenticated;
grant select, insert on table public.products to authenticated;
grant update (brand_id, category_id, name, style_code, updated_at) on table public.products to authenticated;
grant select, insert on table public.skus to authenticated;
grant update (product_id, sku_code, size, color, barcode, approved_unit_cost, currency_code, updated_at) on table public.skus to authenticated;
grant select, insert on table public.data_uploads to authenticated;
grant update (status, row_count, warnings_accepted_at, warnings_accepted_by, updated_at) on table public.data_uploads to authenticated;
grant select, insert on table public.raw_upload_rows to authenticated;
grant select, insert on table public.staging_inventory_rows to authenticated;
grant update (location_id, sku_code, product_name, location_code, on_hand_quantity, approved_unit_cost, currency_code, first_available_at, units_sold_90, units_sold_30, validation_status, updated_at) on table public.staging_inventory_rows to authenticated;
grant select, insert on table public.validation_issues to authenticated;
grant update (accepted_at, accepted_by) on table public.validation_issues to authenticated;
grant select on table public.inventory_snapshots to authenticated;
grant select on table public.inventory_positions to authenticated;
grant select on table public.sales_facts to authenticated;

commit;
