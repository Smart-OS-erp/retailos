# Phase 0.5 — Automatic Intelligence Recalculation Validation

Date: 2026-07-18

## Scope

This milestone adds tenant-scoped evidence and trigger wiring for automatic
Inventory Recovery Intelligence recalculation after approved ingestion pipeline
writes.

## Implemented behavior

- Approved inventory consolidation writes an `intelligence_recalculation_runs`
  row and triggers the existing deterministic intelligence engine after the
  approved snapshot is fully written.
- Recalculation evidence is RLS-protected, tenant-scoped, idempotent per source
  event, and audit logged.
- Product master, store master, and sales history approval runs write skipped
  recalculation evidence with reason
  `canonical_record_type_not_inventory_scored`.

## Honest limitation

Phase 0 scoring reads approved `inventory_positions`. It does not yet consume
standalone product, location, or sales-fact changes. RetailOS therefore records
skipped recalculation evidence for those approval flows instead of pretending
they changed inventory-risk scores.

## Focused validation

- `npm run test -- tests/integration/phase0-consolidation-hub.test.ts tests/integration/phase0-5-integration-hub.test.ts`
  - Result: passed, 23 tests.

## Full validation

- `npm run lint`
  - Result: passed.
- `npm run typecheck`
  - Result: passed.
- `npm run test`
  - Result: passed, 26 test files and 122 tests.
- `npm run security`
  - Result: passed. RLS migration contract covered 46 public tables.
- `npm run build`
  - Result: passed. Next.js generated 47 app routes.
- `git diff --check`
  - Result: passed.
- Sensitive-value scan for known leaked secret patterns
  - Result: no real secret values found. Matches were limited to fake
    WooCommerce unit-test credentials and non-secret stock field names.

## Deployment evidence

- PR: #38, merged to `main`.
- Merge commit: `0d66382`.
- Hosted Supabase migration:
  - `20260716233000_phase0_5_auto_intelligence_recalculation.sql`
  - Result: applied on July 18, 2026 through ignored local env/secret-management path. No secret values were printed.
- Vercel production deployment:
  - Deployment ID: `dpl_7Lakn9cvcZu6TVuN6KwPTs3aL5Xp`
  - Deployment URL: `https://retailos-ebe9v5trm-tonybabalola-1114s-projects.vercel.app`
  - Production alias: `https://retailos-ten.vercel.app`
  - Status: READY.
- Live smoke:
  - `https://retailos-ten.vercel.app/login` returned 200.
  - `https://retailos-ten.vercel.app/signup` returned 200.
  - `https://retailos-ten.vercel.app/api/cron/integration-sync` returned 401 without `CRON_SECRET`.
- Runtime logs:
  - `npx vercel logs https://retailos-ebe9v5trm-tonybabalola-1114s-projects.vercel.app --since 10m --level error`
  - Result: no logs found in the inspected window.
