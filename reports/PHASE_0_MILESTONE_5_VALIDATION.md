# Phase 0 Milestone 5 Validation

## Outcome

Milestone 5 — Projectisation Engine is implemented and verified locally on the
`phase-0-end-to-end` branch. Hosted migration and protected-preview
verification remain pending.

## Implemented evidence

- Evidence-bound recovery projects, SKU links, internal tasks, deterministic
  campaign briefs, and immutable approval records.
- Idempotent opportunity-to-project creation with proposal-only constraints.
- Versioned project submission, independent project approval, independent
  campaign-brief approval, and guarded task transitions.
- Self, stale, replayed, cross-tenant, invalid-state, and unauthorized actions
  fail closed in database functions.
- Store task reads/writes remain assigned-location scoped; viewers remain
  read-only.
- Live project, opportunity, project detail, campaign brief, approval, task,
  completed-project, and currency-separated projectised-value surfaces.

## Commands and results

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run security` — passed: 32 public tenant tables covered by the migration
  contract; scanners remain heuristic evidence.
- `npm run build` — passed: Next.js production build with 34 application routes.
- `npm run test` — initial concurrent run timed out in one security test while
  the build was active; isolated rerun passed: 12 files, 62 tests.

## Gate decision

Milestone 5 is accepted locally. Milestone 6 may begin. Hosted database and
browser evidence are not yet claimed.
