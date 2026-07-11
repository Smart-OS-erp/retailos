# Recent Failures

## 2026-07-11 — Onboarding location save rejected uppercase retail codes

- **Observed:** users could confirm email, create an organization, and reach
  the Location step, but submitting values like `LAG-LEK` or `ABJ-AR1`
  returned "Location needs attention" and refresh preserved the same failed
  state. The stepper also did not offer an obvious way back to earlier setup
  steps.
- **Cause:** the server action uppercased location and brand codes before
  insert, while the Phase 0 database check constraint intentionally accepts
  canonical lowercase internal codes only.
- **Impact:** fresh and existing test users were blocked on step 2 of
  onboarding even though authentication and organization setup succeeded.
- **Resolution:** normalize submitted location/brand codes to lowercase before
  persistence, render stored codes back as uppercase for retail readability,
  make duplicate-code retry idempotent within the current organization, add
  tenant-scoped reads for onboarding location/brand lists, and add back/clickable
  stepper navigation for completed/current onboarding steps.
- **Status:** resolved in hosted deployment. PR #5 merged, Vercel preview and
  main deployments reached READY, hosted live schema/RLS checks pass, and the
  user reported setup/onboarding succeeds after the fix.

## 2026-07-11 — Hosted Phase 0 schema verification confirms missing migrations

- **Observed:** `npm run test:live-phase0-schema` reached hosted Supabase but
  reported missing Phase 0 relation/view endpoints and RPC endpoints, including
  `onboarding_checklists`.
- **Cause:** the hosted project currently exposes the secure foundation schema,
  but the Phase 0 expansion/data/consolidation/intelligence/projectisation and
  Copilot migrations have not been applied or are not visible through PostgREST.
- **Impact:** authenticated users can have valid sessions while `/onboarding`
  fails closed to `/setup-error?error=setup-state`.
- **Resolution:** generated `.tmp/phase0-hosted-migration.sql`, applied the
  reviewed Phase 0 SQL to the approved non-production Supabase project through
  Supabase SQL Editor, reran hosted schema/RLS verification, and completed a
  deployed setup/onboarding verification path.
- **Status:** resolved for hosted schema/setup-state. Supabase migration history
  was later repaired through the reviewed SQL Editor fallback and live hosted
  schema/RLS checks still pass.

## 2026-07-10 — Preview signup confirmation used localhost and onboarding looped

- **Observed:** a hosted preview signup sent a confirmation link to
  `localhost:3000/?code=...`, and the authenticated preview reached
  `/onboarding?error=setup-state` with `ERR_TOO_MANY_REDIRECTS`.
- **Cause:** signup did not provide Supabase `emailRedirectTo`, the confirmation
  route only handled `token_hash` links, `/` discarded `code` confirmation
  parameters, and setup-state errors redirected back into onboarding pages that
  call the same failing context loader.
- **Resolution:** signup now supplies a deployed `/auth/confirm` redirect,
  `/auth/confirm` exchanges Supabase PKCE `code` links and still supports
  `token_hash`, `/` forwards confirmation parameters to `/auth/confirm`, and
  setup-state failures render `/setup-error` instead of looping.
- **Status:** resolved in hosted deployment. Fresh hosted signup/confirmation
  and setup were user-verified after the callback and setup-state fixes.

## 2026-07-10 — Milestone 6 Copilot local validation fixes

- **Observed:** the first Copilot integration assertion expected a store manager
  Morning Brief to always be `answered`, but visible open opportunities may
  already be projectised by earlier workflow evidence.
- **Resolution:** assert the safe statuses (`answered` or
  `insufficient_evidence`) and continue enforcing citation scope, refusal,
  read-only behavior, user-only logs, and cross-tenant denial.
- **Observed:** `npm run typecheck` rejected optional Copilot citation/fact
  normalization under `exactOptionalPropertyTypes`.
- **Resolution:** omit optional values unless the RPC returned them.
- **Status:** resolved; `npm run typecheck`, `npm run test:integration`,
  `npm run test`, and `npm run build` pass after the fixes.

## 2026-07-06 — Concurrent build/test security-test timeout

- **Observed:** the five-second browser-boundary security test timed out while a
  full Turbopack production build was consuming the same Windows workspace.
- **Resolution:** allow the successful build to finish, then rerun `npm run test`
  without competing compilation; all 12 files and 62 tests passed.
- **Status:** resolved; no assertion failed and no test was skipped.

## 2026-07-05 — Vercel CLI misclassified preview attempts

- **Observed:** two CLI deployments were reported by Vercel as targeting production even without `--prod`, including one attempt with explicit `--target=preview`.
- **Resolution:** remove both deployments immediately and verify through the Vercel API that the project has zero active deployments. Preview variables remain scoped only to Preview.
- **Remaining action:** complete the account's GitHub login connection and use the connected feature branch to create the protected preview. Vercel Authentication and Git fork protection are already enabled.
- **Status:** unauthorized deployment exposure resolved; protected preview remains blocked.

## 2026-07-05 — Non-production Supabase deployment constraints

- **Observed:** Supabase CLI management commands lacked an authenticated CLI session, and the direct database hostname could not be reached from this IPv4-only environment. The hosted default email service also disabled confirmation-template editing.
- **Resolution:** apply the already-reviewed additive migration through authenticated SQL Editor, verify it through the live two-tenant harness, and commit the intended Auth configuration/template as code. No credentials were printed or committed.
- **Remaining action:** configure approved custom SMTP or an eligible Supabase plan for the token-hash template, or explicitly accept current hosted confirmation behavior for the protected demo.
- **Status:** database/RLS verification and migration-history repair are resolved; hosted email template remains an open blocker/decision.

## 2026-07-05 — Parallel local test timeout

- **Observed:** the PGlite integration `beforeAll` exceeded its ten-second hook limit while lint, typecheck, tests, and security scans were launched concurrently.
- **Resolution:** rerun the quality gates without competing database initialization; all 15 tests passed and the production build completed.
- **Status:** resolved; no test was skipped in the successful run.

## 2026-07-05 — Phase-leak review false positive

- **Observed:** a broad text search flagged negative security assertions and the explicit “No dashboard” onboarding message.
- **Cause:** the review searched for roadmap words rather than implemented route/module paths.
- **Resolution:** retain the negative regression tests and inspect actual route directories for prohibited modules.
- **Status:** resolved; no dashboard or future-phase route exists.

## 2026-07-05 — Initial technical-foundation validation

- **Observed:** lint rejected CommonJS imports in executable `.ts` harness scripts, and TypeScript treated those scripts as shared global files.
- **Cause:** application lint/typecheck became active after the package scaffold, while the pre-existing scripts intentionally use Node-executable CommonJS syntax.
- **Resolution:** keep the scripts executable under Node, lint them with the CommonJS import rule disabled, exclude them from application TypeScript compilation, and validate them through direct execution/security jobs.
- **Status:** resolved; lint, typecheck, and security commands pass.

## 2026-07-05 — PostCSS advisory

- **Observed:** `npm audit` reported a moderate PostCSS advisory through Next.js.
- **Resolution:** pin PostCSS `8.5.16` through an npm override and regenerate the lockfile.
- **Status:** resolved; `npm audit --audit-level=moderate` reports zero vulnerabilities.

## 2026-07-05 — Package commands not applicable

- **Environment:** local harness validation on `harness-foundation`.
- **Commands:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run security`.
- **Observed result:** each exited 1 because `package.json` does not exist.
- **Cause:** the approved harness-only milestone explicitly prohibits creating the application scaffold or package toolchain.
- **Owner / next action:** engineering must introduce `package.json`, `package-lock.json`, and real scripts together in the separately approved secure technical-foundation PR; CI will then require all quality commands.
- **Status:** expected and not applicable to this harness milestone; not reported as passing.

This earlier harness-only limitation is resolved by the approved technical-foundation package scaffold.

When a validation, migration, deployment, tenant-isolation, or security check fails, record the date, commit/environment, command or scenario, observed result, cause if known, owner, and next action. Do not include secrets or sensitive tenant data.
