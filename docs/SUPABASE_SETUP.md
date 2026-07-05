# Supabase Setup

This is a setup plan for the next approved task. No Supabase project, schema, or client is configured in the harness milestone.

## Required setup sequence

1. Create or select separate local, preview/staging, and production projects.
2. Record only public project URL and anon/publishable values in approved environment files; keep secret/service-role values server-only in managed secret stores.
3. Initialize versioned migrations under `supabase/migrations/`.
4. Create organization, membership, role/permission, and audit foundations with explicit foreign keys and tenant identifiers.
5. Enable RLS before tenant tables become usable and add deny-by-default policies.
6. Add policy tests with at least two tenants and multiple roles.
7. Configure Auth URLs, approved providers, email behavior, session handling, MFA roadmap, and rate controls per environment.
8. Configure private storage buckets and upload policies only when uploads enter active scope.
9. Generate types from the reviewed schema and verify migration reproducibility.

## Environment boundary

Use `.env.local` for local secrets and Vercel/Supabase secret management for deployed environments. The committed `.env.example` contains empty assignments for these names only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

Only the two `NEXT_PUBLIC_` variables may be read by browser code. `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are server-only and must never enter client modules, browser bundles, logs, screenshots, or committed files.

## Release requirements

Migrations must be forward-reviewed, rollback-aware, backed up where destructive, and exercised in a non-production environment. See `docs/security/SUPABASE_SECURITY.md`.
