# Phase 0.5 Milestone 11 — Shopify MVP Worker

## Outcome

Implemented the first provider-specific Phase 0.5 MVP worker for Shopify.

## Implemented

- Server-only Shopify worker orchestration.
- Tenant/job/source re-check before provider access.
- Server-only credential resolver using ignored environment/secret management.
- Shopify Admin GraphQL client for product, variant, and inventory-level payloads.
- Raw external-record persistence through `external_records`.
- Handoff to existing `normalize_external_records(sync_job_id)` through the authenticated server action.
- Unit coverage for fail-closed credentials, raw-record persistence, normalization handoff, and Shopify payload mapping.

## Security notes

- Shopify secrets are not stored in `data_sources.connection_metadata`.
- Shopify secrets are not read in browser/client code.
- `SHOPIFY_CONNECTOR_CREDENTIALS_JSON` is optional and must be set only through ignored local env or Vercel/server secret management.
- The worker fails closed when a source is marked configured but the server cannot resolve credentials.
- Provider output writes only raw `external_records` before normalization and validation evidence.
- The worker does not write directly to canonical inventory, products, locations, sales, intelligence, projectisation, or campaign tables.

## Not implemented

- Shopify OAuth/setup UI.
- Scheduled Shopify sync.
- Shopify webhooks.
- WooCommerce worker.
- Google Sheets worker.
- Automatic canonical product/location/sales writes.
- Automatic intelligence recalculation after normalized uploads.

## Acceptance evidence

- `npm run typecheck` — passed.
- `npm run test:unit` — passed.
- `npm run lint` — passed.
- `npm run test` — passed.
- `npm run security` — passed.
- `npm run build` — passed.

## Deployment evidence

Not deployed in this branch yet. This milestone is ready for PR review and
preview deployment after push.
