# Phase 0.5 — Canonical Write Approval Flows Validation

## Scope

This milestone adds explicit approval flows for normalized non-inventory records.

It is limited to:

- approval evidence table for product/store/sales external-record approvals;
- `approve_product_master_records(upload_id, expected_content_sha256)`;
- `approve_store_master_records(upload_id, expected_content_sha256)`;
- `approve_sales_history_records(upload_id, expected_content_sha256)`;
- tenant-scoped, authenticated, `data.manage`-guarded canonical writes;
- product/SKU, location, and sales fact writes only after digest-guarded approval.

It does not add automatic intelligence recalculation, Google Sheets, OAuth, browser credential entry, dashboards, Phase 1 inventory ledger, POS, finance, wholesale, warehouse management, forecasting, marketplace publishing, autonomous campaign execution, or real LLM agent execution.

## Security decisions

- Approval requires `auth.role() = 'authenticated'` and `data.manage`.
- Approval requires exact `content_sha256` evidence and row-count consistency.
- Blocking validation issues prevent approval.
- Warning validation issues must be accepted before approval.
- Connectors still write only raw `external_records`; canonical records mutate only through explicit approval RPCs.
- Approval runs are tenant-scoped and RLS-readable by `data.view`.

## Focused validation run during implementation

```bash
npm run typecheck
npm run test -- tests/integration/phase0-5-integration-hub.test.ts
```

Result:

- TypeScript passed.
- 1 test file passed.
- 15 tests passed.

## Full validation run before acceptance

Run on branch `phase-0-5-canonical-approval-flows`:

```bash
npm run lint
npm run typecheck
npm run test
npm run security
npm run build
```

Result:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed: 26 test files, 122 tests.
- `npm run security` passed:
  - environment key-name contract;
  - service-role client boundary;
  - static dashboard scan;
  - API route protection scan for 3 route files;
  - Supabase query scope scan;
  - RLS migration contract for 45 public tables.
- `npm run build` passed: Next.js production build generated 47 app routes.

Production was not changed by this local validation run. Deployment ID, production commit SHA, runtime logs, rollback target, migration status, and smoke evidence must be recorded after PR merge/deploy.
