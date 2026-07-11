# Phase 0 Milestone 6 Validation

## Outcome

Milestone 6 — Retail Copilot is implemented and verified locally on the
`phase-0-end-to-end` branch. Hosted migration and protected-preview
verification remain pending.

## Implemented evidence

- Permission-scoped `copilot_activity_log` with forced RLS and caller-only
  read access.
- Deterministic `get_retail_copilot_answer` RPC for Morning Brief, inventory
  risk, recovery opportunity, and recovery project explanations.
- Unsupported or prompt-injection-style categories refuse with no citations and
  no action execution.
- Store manager and cross-tenant attempts against inaccessible records refuse
  with empty citations.
- Retail Copilot overview, Morning Brief, risk, opportunities, and project
  support surfaces render live RPC evidence only.
- Navigation and application RBAC now include `copilot.use` for approved Phase 0
  roles.
- Copilot remains read-only: no LLM call, no free-form chat execution, no
  pricing, inventory, publishing, or workflow mutation.

## Commands and results

- `npm run test:integration` — passed: 4 files, 26 tests.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run security` — passed: 33 public tenant tables covered by the migration
  contract; scanners remain heuristic evidence.
- `npm run test` — passed: 12 files, 63 tests.
- `npm run build` — passed: Next.js production build with 39 app routes,
  including `/copilot`, `/copilot/morning-brief`, `/copilot/risk`,
  `/copilot/opportunities`, and `/copilot/projects`.

## Gate decision

Milestone 6 is accepted locally. Milestone 7 role workspaces may begin. Hosted
database and browser evidence are not yet claimed.
