# Phase 0.5 Milestone 8 Validation — Record Type Mappings

## Outcome

Implemented Phase 0.5 mapping contracts for all approved Import API record types:

- `inventory_snapshot`
- `product_master`
- `store_master`
- `sales_history`

## Implemented

- Added `20260715143000_phase0_5_record_type_mappings.sql`.
- Replaced `public.normalize_external_records(target_sync_job_id uuid)` with a mapper that handles all approved record types.
- Inventory snapshot records normalize into inventory staging rows for the existing consolidation approval path.
- Product master, store master, and sales history records normalize into raw upload and validation evidence for review before any canonical write.
- Sync jobs and data sources now report honest status/error summaries for mapped records, validation warnings, and validation blockers.
- Added integration coverage proving:
  - all approved record types map safely;
  - invalid records produce validation blockers;
  - mapped product/store/sales records do not directly create products, locations, or sales facts;
  - idempotent retry returns the original upload;
  - unauthorized cross-tenant normalization is denied.

## Security notes

- No provider credentials were added.
- No service-role client was added.
- No scheduled sync worker was added.
- No Shopify, WooCommerce, or Google Sheets API calls were added.
- Canonical inventory remains behind `consolidate_inventory_upload(...)`.
- Product/location/sales canonical writes remain review-gated future work; this milestone preserves raw/mapped evidence only.

## Not implemented

- Hosted Supabase migration application for Milestone 7/8.
- Real provider authentication.
- Provider sync workers.
- Scheduled sync workers.
- Automatic product/location/sales canonical consolidation.
- Automatic intelligence recalculation after normalized uploads.

## Validation

Validation passed on 2026-07-15:

```bash
npm run test:integration -- tests/integration/phase0-5-integration-hub.test.ts
# passed, 5 files / 39 tests

npm run lint       # passed
npm run typecheck  # passed
npm run test       # passed, 19 files / 94 tests
npm run security   # passed
npm run build      # passed
```
