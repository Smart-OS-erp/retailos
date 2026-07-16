# Phase 0.5 — WooCommerce MVP Worker Validation

## Scope

This milestone adds one remaining provider worker after Shopify: WooCommerce.

It is limited to:

- server-only WooCommerce credential availability through ignored env/secret management;
- a bounded WooCommerce REST API worker for MVP data sources;
- raw `product_master` and `inventory_snapshot` external-record writes;
- provider-sync handoff to `normalize_external_records(sync_job_id)`;
- safe UI availability of the existing "Verify server credentials" action for WooCommerce MVP sources;
- tests and documentation for the provider boundary.

It does not add scheduled sync, OAuth, browser credential entry, webhook verification, Google Sheets, direct canonical writes, intelligence recalculation, POS, finance, wholesale, warehouse management, forecasting, marketplace publishing, autonomous campaign execution, or real LLM agent execution.

## Security decisions

- `WOOCOMMERCE_CONNECTOR_CREDENTIALS_JSON` is optional and server-only.
- `.env.example` contains the variable name only with an empty value.
- WooCommerce consumer keys/secrets are never stored in `data_sources.connection_metadata`, client code, fixtures, screenshots, reports, or docs.
- The worker fails closed when the data source is not MVP-depth, is disabled/paused, has missing credential status, or has unavailable server-side credentials.
- Provider records are written only to tenant-scoped `external_records` before normalization.
- Canonical products, locations, sales facts, inventory intelligence, projectisation, and campaign tables are not directly mutated by the connector.

## Focused validation run during implementation

```bash
npm run typecheck
npm run test -- tests/unit/woocommerce-worker.test.ts tests/unit/provider-credential-verification.test.ts tests/unit/integration-hub-ui.test.ts
```

Result:

- TypeScript passed.
- 3 test files passed.
- 12 tests passed.

## Full validation run before acceptance

Run on branch `phase-0-5-woocommerce-worker`:

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
- `npm run test` passed: 24 test files, 113 tests.
- `npm run security` passed:
  - environment key-name contract;
  - service-role client boundary;
  - static dashboard scan;
  - API route protection scan;
  - Supabase query scope scan;
  - RLS migration contract for 43 public tables.
- `npm run build` passed: Next.js production build generated 46 app routes.

Production was not changed by this local validation run. Deployment ID, production commit SHA, runtime logs, rollback target, and smoke evidence must be recorded after PR merge/deploy.
