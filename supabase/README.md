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

## Current status

The reviewed Phase 0 migrations are applied to `retailos-dev`, Supabase migration history is repaired for the seven applied Phase 0 migrations, and `npm run test:live-supabase` passes the synthetic Auth/onboarding/audit/RBAC/two-tenant RLS matrix with cleanup.

The committed confirmation template uses `token_hash` and the application `/auth/confirm` route. The current hosted Supabase confirmation email behavior is accepted for the protected non-production demo only. Hosted template activation requires custom SMTP or an eligible Supabase plan if required for production; secret SMTP values belong only in managed environment configuration.

## Migration-history repair

The reviewed Phase 0 migrations were applied to the hosted non-production
project through Supabase SQL Editor, then recorded in Supabase CLI migration
history with `supabase/repair_migration_history.sql` after hosted schema/RLS
checks passed.

Preferred path: use the official Supabase CLI `migration repair` command once
the CLI is authenticated for the project.

Fallback path for future non-production repairs: after
`npm run test:live-phase0-schema` and `npm run test:live-supabase` pass against
the target, run `supabase/repair_migration_history.sql` in Supabase SQL Editor.
This fallback only records migration metadata; it does not create product
tables.
