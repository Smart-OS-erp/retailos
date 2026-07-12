# Phase 0.5 Milestone 1 Validation

## Outcome

Implemented the Integration Hub database/security foundation locally on branch
`phase-0-5-integration-hub-foundation`.

This branch does not implement real provider authentication, scheduled workers,
provider-specific API calls, POS, payments, finance, wholesale, warehouse
management, forecasting, marketplace publishing, autonomous execution, or real
LLM agent execution.

## Implemented

- Integration provider catalogue.
- Tenant-scoped data sources.
- Tenant-scoped external records.
- Sync job envelopes with idempotency keys.
- Sync errors.
- Webhook event storage with signature-verification gate.
- Permission-checked `public.create_data_source`.
- Permission-checked `public.enqueue_data_source_sync`.
- RLS, FORCE RLS, explicit anon revokes, and authenticated policies for all new
  public tables.
- TypeScript RBAC permissions for:
  - `integration.view`
  - `integration.manage`
  - `integration.sync`
  - `integration.import`
- Hosted Phase 0.5 migration bundle command:
  - `npm run migration:hosted-phase0-5-bundle`

## Verified locally

- `npm run test -- tests/unit/authorization.test.ts tests/integration/phase0-5-integration-hub.test.ts` — passed: 2 files and 12 tests.
- `npm run migration:hosted-phase0-5-bundle` — passed and wrote `.tmp/phase0-5-hosted-migration.sql`.
- `npm run test:integration` — passed: 5 files and 33 tests.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test` — passed: 16 files and 76 tests.
- `npm run build` — passed.
- `npm run security` — passed; RLS migration contract detected 39 public tables.

## Security evidence

- Anonymous users cannot read the provider catalogue.
- Tenant A cannot read Tenant B data sources.
- Cross-tenant external-record lineage is rejected.
- Executives can view integration state but cannot create data sources.
- Viewers cannot read tenant integration sources.
- Scaffold sync with missing credentials creates a failed sync job and sync error instead of fake success.
- Repeated manual sync with the same idempotency key returns the existing job.
- Unverified webhook events are rejected by RLS.

## Not yet verified

- Hosted Supabase application of the Phase 0.5 migration.
- Browser smoke tests for Integration Hub UI, because UI is not implemented in this branch.

## Next step

Review the diff for secrets and phase leakage, then open a PR. After merge,
apply the reviewed Phase 0.5 migration to the hosted Supabase project and
update hosted schema checks.
