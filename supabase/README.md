# Supabase Foundation

The first Phase 0 migration defines organizations, memberships, RBAC roles, audit events, an atomic onboarding function, explicit grants, and forced RLS.

## Migration discipline

1. Review SQL and the tenant trust boundary.
2. Apply first to a non-production Supabase project.
3. Record migration output without secrets.
4. Run local and live two-tenant RLS tests.
5. Generate Supabase TypeScript types and compare them with `src/types/database.ts`.
6. Document rollback/compatibility implications before production promotion.

Do not use `SUPABASE_SERVICE_ROLE_KEY` for normal user traffic or to make failing RLS tests pass. `seed.sql` remains intentionally empty of product data.

## Phase 0.5

`20260707100000_phase0_5_integration_hub.sql` adds the Integration Hub foundation:

- provider catalogue;
- tenant data sources;
- external records;
- sync jobs;
- sync errors;
- webhook events;
- permission-checked `create_data_source`;
- permission-checked `enqueue_data_source_sync`.

The migration intentionally does not store real provider credentials or perform
real Shopify, WooCommerce, Google Sheets, POS, ERP, or custom-backend syncs.
Scaffolded connectors must fail safely until connector depth and credential
handling are reviewed.

## Current status

The reviewed Phase 0 migrations and Phase 0.5 Integration Hub migration are applied to `retailos-dev`, Supabase migration history is repaired for the seven applied Phase 0 migrations plus `20260707100000_phase0_5_integration_hub.sql`, `npm run test:live-phase0-schema` passes for 40 relation/view endpoints and 13 RPC endpoints, and `npm run test:live-supabase` passes the synthetic Auth/onboarding/audit/RBAC/two-tenant RLS matrix with cleanup.

The committed confirmation template uses `token_hash` and the application `/auth/confirm` route. The current hosted Supabase confirmation email behavior is accepted for the protected non-production demo only. Hosted template activation requires custom SMTP or an eligible Supabase plan if required for production; secret SMTP values belong only in managed environment configuration.

## Migration-history repair

The reviewed Phase 0 and Phase 0.5 migrations were applied to the hosted
non-production project through Supabase SQL Editor, then recorded in Supabase
CLI migration history with `supabase/repair_migration_history.sql` after hosted
schema/RLS checks passed.

Preferred path: use the official Supabase CLI `migration repair` command once
the CLI is authenticated for the project.

Fallback path for future non-production repairs: after
`npm run test:live-phase0-schema` and `npm run test:live-supabase` pass against
the target, run `supabase/repair_migration_history.sql` in Supabase SQL Editor.
This fallback only records migration metadata for already-applied reviewed SQL;
it does not create product tables.
