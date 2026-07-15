# Phase 0.5 Milestone 6 Validation — Connector Strategy

## Outcome

Recorded the Phase 0.5 connector depth decisions and sync retry/rollback contract before enabling real provider authentication or scheduled sync workers.

## Implemented

- Shopify remains `scaffold`.
- WooCommerce remains `scaffold`.
- Google Sheets remains `scaffold`.
- RetailOS Import API remains the approved live ingestion path for tenant-scoped inbound records.
- Scheduled sync behavior remains disabled until a worker implements the documented retry, rollback, idempotency, and pipeline handoff contract.
- Integration Hub copy now reflects that the Import API route is deployed while credential setup remains server-side.

## Security notes

- No real provider credentials were added.
- No secrets were committed.
- Scaffold providers must fail closed while credentials are missing.
- Provider payloads must land in `external_records` before validation/consolidation; connector workers must not write directly to canonical inventory, sales, intelligence, projectisation, or campaign tables.

## Not implemented

- Shopify OAuth/API calls.
- WooCommerce API calls.
- Google Sheets OAuth/service-account access.
- Scheduled sync worker.
- Provider webhook handlers.
- External-record normalization into staging rows.

## Validation

Local validation passed on 2026-07-15:

```bash
npm run lint       # passed
npm run typecheck  # passed
npm run test       # passed, 19 files / 92 tests
npm run build      # passed
npm run security   # passed
```

Hosted Supabase/Vercel smoke was not rerun for this documentation/UI-copy
milestone because no schema, environment, or route behavior changes are
included.

## Remaining blocker

The database password exposed in chat must still be rotated by the environment owner, then Vercel `DATABASE_URL` must be updated and the Import API production smoke rerun.
