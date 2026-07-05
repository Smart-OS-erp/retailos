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

The first migration is applied to `retailos-dev` and `npm run test:live-supabase` passes the synthetic Auth/onboarding/audit/RBAC/two-tenant RLS matrix with cleanup. Because the migration was applied through SQL Editor, reconcile its CLI migration-history entry before using `supabase db push` against this project.

The committed confirmation template uses `token_hash` and the application `/auth/confirm` route. Hosted template activation requires custom SMTP or an eligible Supabase plan; secret SMTP values belong only in managed environment configuration.
