# Phase 0 Milestone 8 Validation

## Outcome

Milestone 8 hosted verification is accepted for the protected non-production demo setup flow.

Phase 0 is implemented, merged to `main`, deployed by Vercel, backed by the hosted Supabase Phase 0 schema, and verified by live schema/RLS/Auth harnesses. The user also confirmed the hosted setup/onboarding flow is successful after the location code-normalization fix.

Phase 0 is not yet approved for real tenant or personal data because production governance and Supabase migration-history reconciliation remain open.

## Verified evidence

- PR #4 merged Phase 0 foundation into `main`.
- PR #5 merged the onboarding code-normalization fix into `main`.
- GitHub CI quality check passed for PR #5.
- GitHub security foundation check passed for PR #5.
- Vercel preview deployment `dpl_4q1sLUx6X9n7vBZPbQRrBbV32Uac` reached READY.
- Vercel main deployment `dpl_64jVS5hFwxSveS1kaFaybQXsJXfu` reached READY.
- Vercel protected fetch confirmed the deployed PR #5 login page responds with HTTP 200 and expected security headers.
- Vercel protected fetch confirmed the main deployment is protected by Vercel SSO.
- `npm run test:live-phase0-schema` passed against hosted Supabase with 34 relation/view endpoints and 11 RPC endpoints.
- `npm run test:live-supabase` passed against hosted Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS.
- User reported the hosted setup/onboarding flow is now successful after the location code-normalization fix.

## Commands and checks

- `git switch main` — passed.
- `git pull --ff-only` — passed; local `main` fast-forwarded to merge commit `89f71e5`.
- `npm run test:live-phase0-schema` — passed.
- `npm run test:live-supabase` — passed.
- Vercel connector `_list_deployments` — confirmed PR #5 and main deployments READY.
- Vercel connector `_web_fetch_vercel_url` — confirmed deployed login/protection behavior.

## Remaining blockers

- Supabase hosted confirmation template decision: accept current hosted email behavior for the protected demo, or configure custom SMTP/eligible plan for the committed token-hash template.
- Supabase migration history repair before future CLI-driven migrations.
- Production governance before real tenant or personal data.

## Gate decision

Hosted setup verification is accepted for the protected non-production Phase 0 demo.

Do not start Phase 0.5 or future-phase work until the remaining release/governance blockers are resolved or explicitly accepted and `reports/CURRENT_STATE.md` is updated by human-approved phase control.
