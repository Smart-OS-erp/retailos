# Phase 0 Milestone 7 Validation

## Outcome

Milestone 7 — Role Workspaces is implemented and verified locally on the
`phase-0-end-to-end` branch. Hosted browser verification remains pending.

## Implemented evidence

- `/workspace` now redirects completed onboarding users to the approved
  role-aware Phase 0 workspace.
- Executive workspace shows live briefing, recovery opportunity, approval, and
  projectised value evidence without FX conversion.
- Merchandising workspace shows live upload, validation, consolidation,
  opportunity, and projectisation state.
- Store Manager workspace shows live assigned-location inventory, tasks, and
  recovery actions under RLS.
- Viewer workspace shows read-only evidence links and summaries without
  mutation forms.
- Workspace routing is covered by unit tests.

## Commands and results

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run security` — passed: 33 public tenant tables covered by the migration
  contract; scanners remain heuristic evidence.
- `npm run test` — passed: 13 files, 65 tests.
- `npm run build` — passed: Next.js production build with 43 app routes,
  including `/workspace/executive`, `/workspace/merchandising`,
  `/workspace/store`, and `/workspace/viewer`.

## Gate decision

Milestone 7 is accepted locally. Milestone 8 hosted Supabase migration,
browser verification, PR, and protected preview may begin. Production deployment
is not approved.
