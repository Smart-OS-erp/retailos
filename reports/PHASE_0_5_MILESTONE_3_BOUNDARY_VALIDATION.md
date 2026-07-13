# Phase 0.5 Milestone 3 Boundary Validation

## Outcome

Documented the RetailOS Import API authentication, tenant-scope, idempotency,
payload, error, audit, rate-limit, and test boundary on branch
`phase-0-5-import-api-boundary`.

This branch does not implement an API route, import credentials, provider
authentication, provider sync workers, scheduled workers, normalization jobs,
POS, payments, finance, wholesale, warehouse management, forecasting,
marketplace publishing, autonomous execution, or real LLM agent execution.

## Implemented

- `docs/IMPORT_API_BOUNDARY.md`
- `plans/PHASE_0_5_IMPORT_API_BOUNDARY_PLAN.md`
- API security documentation update.
- Phase 0.5 scope documentation update.
- Current state, next task, and blocker updates.

## Security decisions

- Tenant scope must be derived from server-verified import credentials.
- Caller-supplied `organization_id` must be ignored or rejected.
- Import tokens must be generated server-side and stored only as hashes.
- `Idempotency-Key` is required.
- Imported records must land in `external_records` before validation.
- Import API must not write directly to canonical inventory/sales/intelligence tables.
- Service role is not used for normal import traffic.

## Verified locally

- `npm run test -- tests/unit/import-api-boundary.test.ts` — passed: 1 file and 2 tests.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test` — passed: 18 files and 82 tests.
- `npm run build` — passed.
- `npm run security` — passed.
- `npm run test:live-phase0-schema` — passed: 40 relation/view endpoints and 13 RPC endpoints.
- `npm run test:live-supabase` — passed: Auth, onboarding, audit, RBAC, and two-tenant RLS matrix.

## Not yet implemented

- Import credential schema.
- Token generation, rotation, and revocation actions.
- `/api/import/v1/records`.
- Request validation code.
- Import API rate limiting.
- External-record normalization to staging/validation tables.

## Next step

After review and merge, build the Import API credential/schema foundation with
negative security tests before exposing the ingestion route.
