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
