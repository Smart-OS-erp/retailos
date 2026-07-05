# Recent Failures

## 2026-07-05 — Package commands not applicable

- **Environment:** local harness validation on `harness-foundation`.
- **Commands:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run security`.
- **Observed result:** each exited 1 because `package.json` does not exist.
- **Cause:** the approved harness-only milestone explicitly prohibits creating the application scaffold or package toolchain.
- **Owner / next action:** engineering must introduce `package.json`, `package-lock.json`, and real scripts together in the separately approved secure technical-foundation PR; CI will then require all quality commands.
- **Status:** expected and not applicable to this harness milestone; not reported as passing.

When a validation, migration, deployment, tenant-isolation, or security check fails, record the date, commit/environment, command or scenario, observed result, cause if known, owner, and next action. Do not include secrets or sensitive tenant data.
