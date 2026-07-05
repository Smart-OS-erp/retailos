# Recent Failures

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
