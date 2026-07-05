# Supabase Boundary

Supabase is not configured in the harness milestone. This directory reserves the reviewed location for migrations and synthetic local/test seed data.

Before adding a migration:

1. confirm the active-phase requirement;
2. model organizations and tenant ownership explicitly;
3. enable and test RLS for tenant tables;
4. add migration and policy tests, including cross-tenant denial;
5. avoid production data and secrets in `seed.sql`;
6. document rollback/compatibility implications.

See `docs/SUPABASE_SETUP.md` and `docs/security/SUPABASE_SECURITY.md`.
