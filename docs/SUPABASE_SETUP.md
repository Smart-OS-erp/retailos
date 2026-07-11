# Supabase Setup

The secure technical foundation includes reviewed client boundaries, a versioned migration, local Auth configuration-as-code, and a live isolation harness. The migration is applied to the non-production `retailos-dev` project and the live Auth/RLS matrix passes. Production promotion is not approved.

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

## Current non-production evidence

- `20260705113000_secure_technical_foundation.sql` was applied successfully through Supabase SQL Editor.
- Confirm-email signups are enabled, minimum password length is eight, and the two local `/auth/confirm` callback URLs are allowlisted.
- `npm run test:live-supabase` creates isolated synthetic identities and tenants, verifies Auth/onboarding/audit/RBAC/RLS allow-deny behavior through anon and authenticated clients, and removes its fixtures.
- `supabase/config.toml` and `supabase/templates/confirmation.html` contain the intended local Auth configuration and token-hash template.

The SQL Editor application did not register the version in Supabase CLI migration history. Reconcile that history before a later `db push`. The hosted token-hash email body also remains blocked until custom SMTP or an eligible Supabase plan is configured; never commit or paste SMTP credentials.

## Hosted Phase 0 migration checklist

Use this checklist for the current protected PR #4 preview only. Do not paste
database passwords, service-role keys, SMTP credentials, or connection strings
into chat.

1. Confirm the target Supabase project is the approved non-production
   `retailos-dev` project.
2. Confirm this foundation is already present before using the default
   hosted-pending bundle:
   - `20260705113000_secure_technical_foundation.sql`
3. Generate the reviewed hosted-pending bundle locally:

   ```bash
   npm run migration:hosted-bundle
   ```

   This writes `.tmp/phase0-hosted-migration.sql`. The `.tmp/` folder is
   ignored by Git. The script only reads committed SQL migrations and prints
   SHA256 checksums; it does not read environment variables or apply SQL.
4. Apply `.tmp/phase0-hosted-migration.sql` once through Supabase SQL Editor or
   an authenticated Supabase CLI session. The default bundle applies these
   source migrations in order:
   - `20260705140000_phase0_foundation_expansion.sql`
   - `20260706100000_phase0_data_foundation.sql`
   - `20260706110000_phase0_consolidation_hub.sql`
   - `20260706120000_phase0_inventory_recovery_intelligence.sql`
   - `20260706130000_phase0_projectisation_engine.sql`
   - `20260706140000_phase0_retail_copilot.sql`
5. If `20260705140000_phase0_foundation_expansion.sql` has already been
   applied and verified in another environment, generate the data-forward-only
   bundle explicitly instead:

   ```bash
   node scripts/build-hosted-migration-bundle.ts --data-forward-only --write .tmp/phase0-data-forward-migration.sql
   ```

6. If the target is a fresh non-production database, do not use the default
   bundle. Generate the complete Phase 0 set explicitly instead:

   ```bash
   node scripts/build-hosted-migration-bundle.ts --full-phase0 --write .tmp/phase0-full-migration.sql
   ```

7. In Supabase Auth URL configuration, add the protected preview confirmation
   callback before testing signup:
   - `https://retailos-git-phase-0-end-to-end-tonybabalola-1114s-projects.vercel.app/auth/confirm`
   - `https://retailos-qq1yxqnsz-tonybabalola-1114s-projects.vercel.app/auth/confirm`

   Keep production URLs out of the non-production project until production
   deployment is approved.
8. After applying SQL and updating the redirect allowlist, rerun:

   ```bash
   npm run test:live-phase0-schema
   npm run test:live-supabase
   ```

   Then run a protected-preview smoke test with a fresh test email: signup,
   email confirmation, organization creation, onboarding setup, and role-aware
   protected-route access.

## Environment boundary

Use `.env.local` for local secrets and Vercel/Supabase secret management for deployed environments. The committed `.env.example` contains empty assignments for these names only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

Only the two `NEXT_PUBLIC_` variables may be read by browser code. `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are server-only and must never enter client modules, browser bundles, logs, screenshots, or committed files.

## Release requirements

Migrations must be forward-reviewed, rollback-aware, backed up where destructive, and exercised in a non-production environment. See `docs/security/SUPABASE_SECURITY.md`.
