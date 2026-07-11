-- RetailOS Phase 0 migration-history repair handoff
--
-- Purpose:
--   The reviewed Phase 0 SQL has been applied to the hosted Supabase project
--   through SQL Editor. This fallback script records those already-applied
--   migrations in Supabase CLI migration history so a later `supabase db push`
--   does not try to replay them.
--
-- Preferred path:
--   Use the official Supabase CLI migration repair command when an
--   authenticated CLI is available.
--
-- Fallback path:
--   Run this SQL in Supabase SQL Editor only after:
--   1. The target project is the approved non-production RetailOS project.
--   2. `npm run test:live-phase0-schema` passes against that target.
--   3. `npm run test:live-supabase` passes against that target.
--
-- Do not run this against production without a separate approval.

begin;

create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);

alter table supabase_migrations.schema_migrations
  add column if not exists statements text[];

alter table supabase_migrations.schema_migrations
  add column if not exists name text;

insert into supabase_migrations.schema_migrations (version, name, statements)
values
  (
    '20260705113000',
    'secure_technical_foundation',
    array['Applied manually through SQL Editor; reviewed source: supabase/migrations/20260705113000_secure_technical_foundation.sql']
  ),
  (
    '20260705140000',
    'phase0_foundation_expansion',
    array['Applied manually through SQL Editor; reviewed source: supabase/migrations/20260705140000_phase0_foundation_expansion.sql']
  ),
  (
    '20260706100000',
    'phase0_data_foundation',
    array['Applied manually through SQL Editor; reviewed source: supabase/migrations/20260706100000_phase0_data_foundation.sql']
  ),
  (
    '20260706110000',
    'phase0_consolidation_hub',
    array['Applied manually through SQL Editor; reviewed source: supabase/migrations/20260706110000_phase0_consolidation_hub.sql']
  ),
  (
    '20260706120000',
    'phase0_inventory_recovery_intelligence',
    array['Applied manually through SQL Editor; reviewed source: supabase/migrations/20260706120000_phase0_inventory_recovery_intelligence.sql']
  ),
  (
    '20260706130000',
    'phase0_projectisation_engine',
    array['Applied manually through SQL Editor; reviewed source: supabase/migrations/20260706130000_phase0_projectisation_engine.sql']
  ),
  (
    '20260706140000',
    'phase0_retail_copilot',
    array['Applied manually through SQL Editor; reviewed source: supabase/migrations/20260706140000_phase0_retail_copilot.sql']
  )
on conflict (version) do update
set
  name = excluded.name,
  statements = case
    when supabase_migrations.schema_migrations.statements is null
      or array_length(supabase_migrations.schema_migrations.statements, 1) is null
      then excluded.statements
    else supabase_migrations.schema_migrations.statements
  end;

commit;

select version, name
from supabase_migrations.schema_migrations
where version in (
  '20260705113000',
  '20260705140000',
  '20260706100000',
  '20260706110000',
  '20260706120000',
  '20260706130000',
  '20260706140000'
)
order by version;
