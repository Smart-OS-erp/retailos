# Phase 0.5 Milestone 4 Validation — Import API Credential Foundation

## Scope

Implemented the database control-plane required before exposing the RetailOS
Import API ingestion route.

This milestone adds:

- `import_api_credentials`
- `import_api_idempotency_keys`
- `import_api_rate_limit_events`
- `create_import_api_credential`
- `revoke_import_api_credential`
- RLS, grants, audit triggers, and tenant-lineage constraints

It does not add `/api/import/v1/records`, provider workers, scheduled sync,
normalization, dashboards, POS, finance, wholesale, forecasting, or autonomous
execution.

## Local validation

- `npm run test -- tests/integration/phase0-5-integration-hub.test.ts`
  - Passed.
  - Covers credential creation, token-hash column protection, Import API source
    restrictions, replay/idempotency evidence, rate-limit evidence, revocation,
    audit evidence, and cross-tenant denial.

## Security notes

- Raw Import API tokens are not stored.
- `token_hash` is excluded from authenticated column-level `select` grants.
- Credentials are bound to one organization and one Import API data source.
- Idempotency keys are unique per organization/data source.
- Rate-limit evidence is tenant-scoped and credential-scoped.
- The ingestion route remains intentionally absent.

## Hosted status

Not applied to hosted Supabase yet. After PR review/merge, apply
`20260713160000_phase0_5_import_api_credentials.sql` and run hosted schema and
live RLS verification.
