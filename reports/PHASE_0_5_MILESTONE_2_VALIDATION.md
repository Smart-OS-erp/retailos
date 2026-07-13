# Phase 0.5 Milestone 2 Validation

## Outcome

Implemented the first Integration Hub setup UI slice on branch
`phase-0-5-integration-hub-ui`.

This branch does not implement real provider authentication, connector API calls,
scheduled workers, RetailOS Import API, external-record normalization, POS,
payments, finance, wholesale, warehouse management, forecasting, marketplace
publishing, autonomous execution, or real LLM agent execution.

## Implemented

- Protected `/integrations` route for roles with `integration.view`.
- Role-aware sidebar/mobile navigation entry for Integration Hub.
- Live provider catalogue display from `integration_providers`.
- Live tenant data-source table from `data_sources`.
- Live recent sync-job status from `sync_jobs`.
- Live external-record count from `external_records`.
- Data-source creation form backed by the reviewed `create_data_source` RPC.
- Manual sync request form backed by the reviewed `enqueue_data_source_sync` RPC.
- Onboarding `/onboarding/data-source` upgraded from readiness-only to source
  setup with the approved "system behind the website" positioning.
- TypeScript database contract updated for Phase 0.5 tables, enums, and RPCs.

## Security evidence

- UI create/sync actions re-check active organization identity server-side.
- UI create/sync actions enforce `integration.manage` and `integration.sync`
  before calling Supabase RPCs.
- Return paths are allowlisted to prevent open redirect behavior.
- Service-role keys and connector secrets are not used in browser-facing code.
- Real provider credential entry is not built in this slice.

## Verified locally

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test -- tests/unit/integration-hub-ui.test.ts tests/unit/workspace-navigation.test.ts` — passed: 2 files and 6 tests.
- `npm run test` — passed: 17 files and 80 tests.
- `npm run build` — passed and generated the `/integrations` route.
- `npm run security` — passed.
- `npm run test:live-phase0-schema` — passed: 40 relation/view endpoints and 13 RPC endpoints.
- `npm run test:live-supabase` — passed: Auth, onboarding, audit, RBAC, and two-tenant RLS matrix.
- Local in-app browser preview of `http://localhost:3000/integrations` redirected unauthenticated access to `/login`, confirming the protected route boundary without creating a new test account.

## Not yet verified

- Authenticated browser smoke test on a Vercel preview.
- Import API authentication/idempotency design.
- Real connector credential storage or provider sync.
- External-record normalization into validation/consolidation pipeline.

## Next step

After review and merge, design the RetailOS Import API authentication,
idempotency, replay, tenant scoping, and failure contract before implementing
external ingestion.
