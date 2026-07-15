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
products, locations, SKUs, or sales facts in this phase.

## Validation and approval path

```text
external_records
→ normalize_external_records(sync_job_id)
→ data_uploads + raw_upload_rows
→ staging_inventory_rows + validation_issues
→ existing warning acceptance / consolidation approval
→ canonical inventory only after consolidate_inventory_upload(...)
```

Rows with blocking issues keep the upload in `validation_blocked`.

Rows with warnings keep the upload in `parsed` until warnings are accepted.

Rows with no validation issues can make an inventory upload `ready`, but
canonical inventory still requires the existing consolidation function and
digest check. Non-inventory record types remain in `parsed` review state
because product/location/sales canonical write flows are not implemented yet.

## Security controls

- Caller must be authenticated.
- Caller must have both `integration.import` and `data.manage` in the sync job organization.
- Tenant scope is derived from the sync job and data source.
- RLS remains enabled and forced on the new normalization run table.
- Raw external-record evidence remains tenant-scoped and auditable.
- The function does not use service-role credentials and does not bypass the approval path.
- Product master, store master, and sales history mapping deliberately avoid
  direct canonical writes.

## Not implemented

- Provider workers.
- Scheduled sync workers.
- Shopify/WooCommerce/Google Sheets real credentials.
- Automatic consolidation.
- Intelligence recalculation after consolidation.
- Product/location/sales canonical write approval flows.
