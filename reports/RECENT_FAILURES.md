# Recent Failures

## 2026-07-18 - Phase 1 hosted workflow smoke cleanup missed event log dependency

- **Observed:** live Phase 1 workflow smoke passed its workflow assertions but exited non-zero during cleanup.
- **Cause:** synthetic `event_log` rows referenced synthetic locations, so deleting locations before event-log cleanup violated a foreign-key constraint.
- **Resolution:** added `event_log` to the synthetic cleanup order before deleting locations and reran the smoke.
- **Status:** resolved. Rerun passed and reported synthetic cleanup passed.

## 2026-07-16 — Production Import API database authentication failure after Shopify worker merge

- **Observed:** fresh production Import API smoke against `https://retailos-ten.vercel.app` returned `500 internal_error`.
- **Correlation ID:** `f9424e58-9bad-4b9e-8300-db956923fafa`.
- **Deployment:** `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZL`.
- **Runtime evidence:** Vercel runtime logs showed Postgres error `28P01` with message `password authentication failed for user "postgres"`.
- **Cause:** Production `DATABASE_URL` value was stale/invalid for Supabase pooler authentication.
- **Resolution:** replaced Production `DATABASE_URL` from ignored local secret management without printing the value, redeployed production as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`, reran smoke, and verified success.
- **Status:** resolved. Fresh smoke passed and post-smoke runtime error logs for the current deployment showed no error/fatal entries in the inspected window.

## 2026-07-16 — First M0-R smoke attempt failed before Import API due local TLS/Supabase identity setup

- **Observed:** first M0-R smoke attempt failed while creating the synthetic Supabase smoke identity with `ERR_SSL_SSL/TLS_ALERT_BAD_RECORD_MAC`.
- **Cause:** transient local TLS/fetch failure before the Import API request reached production.
- **Resolution:** reran the smoke. The second run reached production and exposed the real Import API database-auth failure recorded above.
- **Status:** resolved as a transient local attempt; not counted as Import API application success or failure.

## 2026-07-15 — Hosted Phase 0.5 migration blocked by direct Supabase database host

- **Observed:** applying Phase 0.5 pipeline handoff and record-type mapping SQL from the local machine failed before SQL execution with DNS resolution error for the direct Supabase database host.
- **Cause:** local ignored `DATABASE_URL` pointed at the direct `db.<project>.supabase.co` host instead of the working pooler/session-pooler host.
- **Resolution:** use Supabase pooler/session-pooler URL in ignored env or apply reviewed SQL through Supabase SQL Editor, then run hosted checks. Later hosted Phase 0.5 schema/RLS verification passed.
- **Status:** resolved for hosted verification; CLI migration-history reconciliation remains blocked until Supabase CLI is installed/authenticated in this shell.

## 2026-07-15 — Import API authenticated smoke blocked by Supabase database URL configuration

- **Observed:** unauthenticated Import API POST failed closed with `401 authentication_required`, but authenticated smoke returned `500 internal_error`.
- **Evidence:** runtime logs showed both direct-host lookup failures and later password authentication failures for user `postgres`.
- **Cause:** deployed `DATABASE_URL` used invalid/unreliable Supabase database connection details.
- **Resolution:** corrected Vercel `DATABASE_URL`, rotated smoke secret, redeployed production, fixed the smoke script idempotency replay, and reran production smoke.
- **Status:** resolved in PR #30; regression recurred on July 16 and was resolved again during M0-R.

## 2026-07-11 — Onboarding location save rejected uppercase retail codes

- **Observed:** users could confirm email, create organization, and reach Location step, but values like `LAG-LEK` returned “Location needs attention.”
- **Cause:** server action uppercased codes while database constraints required lowercase internal codes.
- **Resolution:** normalize submitted location/brand codes to lowercase before persistence, render readable uppercase, make duplicate-code retry idempotent, add tenant-scoped reads, and add back/clickable stepper navigation.
- **Status:** resolved.

## 2026-07-11 — Hosted Phase 0 schema verification confirmed missing migrations

- **Observed:** hosted Supabase was missing Phase 0 relation/view and RPC endpoints.
- **Cause:** secure foundation schema was present but later Phase 0 migrations were not applied/visible.
- **Resolution:** generated and applied reviewed hosted migration bundle, reran hosted schema/RLS verification, and completed setup/onboarding verification.
- **Status:** resolved for hosted schema/setup-state; CLI history was later repaired through SQL fallback, but M0-R still needs CLI history verification.

## 2026-07-10 — Preview signup confirmation used localhost and onboarding looped

- **Observed:** hosted preview signup sent confirmation links to `localhost:3000`, and authenticated preview reached `/onboarding?error=setup-state` with redirect loops.
- **Cause:** signup did not provide deployed `emailRedirectTo`, confirmation route only handled `token_hash`, `/` discarded `code`, and setup-state errors redirected into pages that re-triggered setup-state failures.
- **Resolution:** signup now supplies deployed `/auth/confirm`, confirmation exchanges PKCE `code` links and `token_hash`, `/` forwards confirmation parameters, and setup-state failures render `/setup-error`.
- **Status:** resolved.

## Older resolved failures

Historical local timeout, audit, phase-leak, and scaffold validation failures remain resolved. Do not remove this file; every validation, migration, deployment, tenant-isolation, or security failure must record date, environment, observed result, cause if known, owner/action, and status without secrets.
