# Recent Failures

## 2026-07-05 — Vercel CLI misclassified preview attempts

- **Observed:** two CLI deployments were reported by Vercel as targeting production even without `--prod`, including one attempt with explicit `--target=preview`.
- **Resolution:** remove both deployments immediately and verify through the Vercel API that the project has zero active deployments. Preview variables remain scoped only to Preview.
- **Remaining action:** add the account's GitHub login connection, enable preview protection, and use the connected feature branch to create the protected preview.
- **Status:** unauthorized deployment exposure resolved; protected preview remains blocked.

## 2026-07-05 — Non-production Supabase deployment constraints

- **Observed:** Supabase CLI management commands lacked an authenticated CLI session, and the direct database hostname could not be reached from this IPv4-only environment. The hosted default email service also disabled confirmation-template editing.
- **Resolution:** apply the already-reviewed additive migration through authenticated SQL Editor, verify it through the live two-tenant harness, and commit the intended Auth configuration/template as code. No credentials were printed or committed.
- **Remaining action:** reconcile CLI migration history, then configure approved custom SMTP or an eligible Supabase plan for the token-hash template.
- **Status:** database/RLS verification resolved; migration history and hosted email template remain open blockers.

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
