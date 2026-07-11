# Phase 0 Milestone 2 Validation

## Outcome

Milestone 2 — Data Foundation is implemented and verified locally on the
`phase-0-end-to-end` branch. Remote migration application and protected-preview
verification remain pending release work.

## Implemented evidence

- Tenant-scoped entities, categories, products, SKUs, upload lineage, raw rows,
  inventory staging, validation issues, snapshots, positions, and sales facts.
- Forced RLS, same-tenant composite foreign keys, location-scoped inventory and
  sales reads, revoked anonymous access, and column-level update grants.
- Two-megabyte/10,000-row UTF-8 CSV limits, formula neutralization, strict
  structure checks, tenant location resolution, and explicit blocking/warning
  validation.
- Persisted tenant sample intake and live Data Foundation, uploads, upload
  review, validation, and data-health surfaces.
- Two-tenant/two-location negative tests covering cross-tenant visibility,
  assigned-location scope, viewer mutation denial, immutable tenant keys,
  composite lineage, and anonymous denial.

## Commands and results

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test` — passed: 11 files, 55 tests.
- `npm run security` — passed: 20 public tenant tables covered by the migration
  contract; scanners remain heuristic evidence.
- `npm run build` — passed: Next.js production build with all Milestone 2 routes.

## Gate decision

Milestone 2 is accepted locally. Milestone 3 may begin. The migration is not yet
claimed as applied or verified against the hosted non-production Supabase
project.
