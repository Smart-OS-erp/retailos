# Phase 0.5 Pipeline Handoff

## Purpose

Phase 0.5 external records must enter the existing Phase 0 validation and consolidation path. They must not write directly into canonical inventory, sales, intelligence, projectisation, or campaign tables.

## Implemented handoff

`public.normalize_external_records(target_sync_job_id uuid)` normalizes one tenant-scoped sync job into:

- `external_record_normalization_runs`;
- `data_uploads`;
- `raw_upload_rows`;
- `staging_inventory_rows`;
- `validation_issues`;
- `sync_errors`;
- status updates on `external_records`, `sync_jobs`, and `data_sources`.

It returns the created `data_uploads.id`.

The function is idempotent for a completed sync job. A retry returns the original upload instead of duplicating staging rows.

## Supported record types

The mapper supports all approved Import API record types:

- `inventory_snapshot`
- `product_master`
- `store_master`
- `sales_history`

`inventory_snapshot` records create `staging_inventory_rows` and can later move
through the existing warning-acceptance and consolidation approval path.

`product_master`, `store_master`, and `sales_history` records are mapped into
raw upload and validation evidence for review. They do not directly create
products, locations, SKUs, or sales facts during normalization.

## Validation and approval path

```text
external_records
→ normalize_external_records(sync_job_id)
→ data_uploads + raw_upload_rows
→ staging_inventory_rows + validation_issues
→ explicit warning acceptance where required
→ explicit consolidation or canonical-write approval
→ inventory intelligence recalculation evidence
```

Rows with blocking issues keep the upload in `validation_blocked`.

Rows with warnings keep the upload in `parsed` until warnings are accepted.

Rows with no validation issues can make an inventory upload `ready`, but
canonical inventory still requires the existing consolidation function and
digest check. Product, location, and sales records require their dedicated
approval RPCs before canonical writes happen.

## Intelligence recalculation handoff

Approved inventory consolidation automatically records an
`intelligence_recalculation_runs` row and triggers the existing deterministic
Inventory Recovery Intelligence engine after the approved snapshot is fully
written.

Product master, store master, and sales history approval flows also record
`intelligence_recalculation_runs` evidence, but with `status = 'skipped'` and
`reason = 'canonical_record_type_not_inventory_scored'`. This is intentional:
Phase 0 scoring reads approved inventory positions. It does not yet recalculate
from standalone product, location, or sales-fact changes, and RetailOS must not
pretend those records changed inventory-risk math until that model dependency is
implemented and validated.

## Security controls

- Caller must be authenticated.
- Caller must have both `integration.import` and `data.manage` in the sync job organization.
- Tenant scope is derived from the sync job and data source.
- RLS remains enabled and forced on the new normalization run table.
- Raw external-record evidence remains tenant-scoped and auditable.
- The function does not use service-role credentials and does not bypass the approval path.
- Product master, store master, and sales history mapping deliberately avoid
  direct canonical writes.
- Automatic intelligence recalculation evidence is tenant-scoped, RLS-readable
  to users with `data.view`, and audited.

## Provider worker status

- RetailOS Import API can create `inventory_snapshot`, `product_master`,
  `store_master`, and `sales_history` external records.
- The Shopify Phase 0.5 MVP worker can create `product_master` and
  `inventory_snapshot` external records from Shopify Admin GraphQL product,
  variant, and inventory-level payloads when server-only credentials are
  configured for the data source.
- The WooCommerce Phase 0.5 MVP worker can create `product_master` and
  `inventory_snapshot` external records from WooCommerce REST product and
  stock payloads when server-only credentials are configured for the data
  source.
- Shopify and WooCommerce raw records still enter the same normalization and validation
  evidence path. The worker does not write directly to canonical products,
  SKUs, locations, inventory positions, sales facts, intelligence,
  projectisation, or campaign tables.

## Not implemented

- Google Sheets provider worker.
- Provider credential setup UI.
- Provider OAuth flows.
- Automatic consolidation.
- Scoring model dependency on standalone product, location, and sales-fact
  approvals.
