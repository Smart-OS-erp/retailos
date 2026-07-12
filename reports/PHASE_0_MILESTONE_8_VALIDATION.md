# Phase 0 Milestone 8 Validation

## Outcome

Milestone 8 hosted verification is accepted for the protected non-production demo setup flow.

Phase 0 is implemented, merged to `main` through PR #7, deployed by Vercel, backed by the hosted Supabase Phase 0 schema, verified by live schema/RLS/Auth harnesses, and has repaired Supabase migration history for the manually applied Phase 0 migrations.

Phase 0 is not yet approved for real tenant or personal data because production governance remains open. The current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.

## Verified evidence

- PR #4 merged Phase 0 foundation into `main`.
- PR #5 merged the onboarding code-normalization fix into `main`.
- PR #6 merged the hosted setup verification and migration-history repair handoff into `main`.
- PR #7 merged the Supabase migration-history repair evidence into `main`.
- PR #8 merged the Phase 0 acceptance governance pack into `main`.
- GitHub CI quality check passed for PR #7.
- GitHub security foundation check passed for PR #7.
- Vercel preview deployment for PR #7 reached READY.
- `supabase/repair_migration_history.sql` ran in the Supabase SQL Editor against `retailos-dev` as `postgres`.
- Supabase SQL Editor returned seven repaired migration-history rows:
  - `20260705113000` — `secure_technical_foundation`
  - `20260705140000` — `phase0_foundation_expansion`
  - `20260706100000` — `phase0_data_foundation`
  - `20260706110000` — `phase0_consolidation_hub`
  - `20260706120000` — `phase0_inventory_recovery_intelligence`
  - `20260706130000` — `phase0_projectisation_engine`
  - `20260706140000` — `phase0_retail_copilot`
- `npm run test:live-phase0-schema` passed against hosted Supabase after the repair with 34 relation/view endpoints and 11 RPC endpoints.
- `npm run test:live-supabase` passed against hosted Supabase after the repair: Auth, onboarding, audit, RBAC, and two-tenant RLS.
- User reported the hosted setup/onboarding flow is successful after the location code-normalization fix.
- Founder/environment-owner accepted the current Supabase hosted confirmation email behavior for the protected non-production demo on 2026-07-12.

## Commands and checks

- `git fetch origin` — passed.
- `git switch main` — passed.
- `git pull --ff-only` — passed; local `main` fast-forwarded to merge commit `8ef4f57`.
- `gh pr view 7 --json ...` — confirmed PR #7 merged.
- `gh pr checks 7` — confirmed Quality, Security foundation checks, Vercel, and Vercel Preview Comments pass.
- Supabase SQL Editor — ran `supabase/repair_migration_history.sql` and returned seven expected rows.
- `npm run test:live-phase0-schema` — passed after repair.
- `npm run test:live-supabase` — passed after repair.

## Acceptance-pack validation

The release-readiness decision pack was validated locally on branch `phase0-acceptance-governance-pack`:

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test` — passed: 15 files and 69 tests.
- `npm run build` — passed.
- `npm run security` — passed.
- `npm run test:live-phase0-schema` — passed against hosted Supabase.
- `npm run test:live-supabase` — passed against hosted Supabase.

## Hosted-email acceptance validation

The hosted-email acceptance record was validated locally on branch `accept-hosted-email-behavior`:

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test` — passed: 15 files and 69 tests.
- `npm run build` — passed.
- `npm run security` — passed.

Hosted database settings were not changed by this decision-record update, so live Supabase tests were not rerun for this branch.

## Remaining blockers

- Production governance before real tenant or personal data.
- Production email confirmation behavior remains subject to production governance; custom SMTP/eligible plan support is still expected if the committed token-hash template is required for production.

## Gate decision

Hosted setup verification, migration-history repair, and current hosted Supabase confirmation email behavior are accepted for the protected non-production Phase 0 demo.

Do not start Phase 0.5 or future-phase work until the remaining release/governance blockers are resolved or explicitly accepted and `reports/CURRENT_STATE.md` is updated by human-approved phase control.
