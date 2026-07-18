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

Pending after merge:

- apply `20260716233000_phase0_5_auto_intelligence_recalculation.sql` to hosted
  Supabase through approved secret-management paths;
- deploy or verify Vercel production deployment from merged `main`;
- record production URL/deployment ID and runtime smoke outcome.
