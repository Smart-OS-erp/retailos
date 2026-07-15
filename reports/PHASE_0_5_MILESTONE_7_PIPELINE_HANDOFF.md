# Phase 0.5 Milestone 7 Validation — Pipeline Handoff

## Outcome

Implemented the first Phase 0.5 pipeline handoff from tenant-scoped external records into the existing Phase 0 upload/staging/validation path.

## Implemented

- Added `external_record_normalization_runs` as an auditable handoff envelope.
- Added `public.normalize_external_records(target_sync_job_id uuid)`.
- The function creates `data_uploads`, `raw_upload_rows`, `staging_inventory_rows`, `validation_issues`, and `sync_errors`.
- The function updates `external_records`, `sync_jobs`, and `data_sources` status honestly.
- The function is idempotent for completed sync jobs.
- Added integration coverage for:
  - successful `inventory_snapshot` normalization;
  - unsupported record validation blockers;
  - no canonical inventory writes;
  - idempotent retry;
  - cross-tenant/unauthorized denial.

## Security notes

- No service-role client was added.
- No provider credentials were added.
- No provider API calls or scheduled sync workers were added.
- Canonical inventory remains protected behind `consolidate_inventory_upload(...)`.
- The new normalization run table has forced RLS and a tenant-scoped select policy.

## Not implemented

- Hosted Supabase migration application.
- Product master mapping.
- Sales history mapping.
- Store master mapping.
- Scheduled sync workers.
- Real Shopify, WooCommerce, or Google Sheets connector MVPs.
- Automatic intelligence recalculation from normalized uploads.

## Validation

Validation passed on 2026-07-15:

```bash
npm run test:integration -- tests/integration/phase0-5-integration-hub.test.ts
# passed, 5 files / 38 tests

npm run lint       # passed
npm run typecheck  # passed
npm run test       # passed, 19 files / 93 tests
npm run security   # passed
npm run build      # passed
```

Hosted validation is blocked until the reviewed migration is applied to Supabase.
