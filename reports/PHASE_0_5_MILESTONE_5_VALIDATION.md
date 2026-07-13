# Phase 0.5 Milestone 5 Validation — Import API Route

## Scope

Implemented `POST /api/import/v1/records` for tenant-scoped Import API
ingestion.

The route:

- requires `Authorization: Bearer <RetailOS import token>`;
- requires `Content-Type: application/json`;
- requires `Idempotency-Key`;
- hashes bearer tokens with server-only `IMPORT_API_TOKEN_HASH_SECRET`;
- resolves tenant scope from `import_api_credentials`;
- writes only to `sync_jobs`, `external_records`, Import API idempotency
  evidence, and existing audit-triggered integration evidence;
- rejects unsupported record types and malformed payloads;
- does not write to canonical inventory, sales, intelligence, or projectisation
  tables.

## Verified before route implementation

- PR #15 was merged.
- `20260713160000_phase0_5_import_api_credentials.sql` was applied to hosted
  Supabase through SQL Editor.
- `npm run test:live-phase0-schema` passed: 43 relation/view endpoints and 15
  RPC endpoints.
- `npm run test:live-supabase` passed: Auth, onboarding, audit, RBAC, and
  two-tenant RLS verification.

## Local validation

- `npm run test -- tests/unit/import-api-route.test.ts`
  - Passed.
  - Covers accepted request, missing hash secret fail-closed behavior, missing
    bearer token, missing idempotency key, non-JSON content type, empty records,
    unsupported record type, and idempotency conflict.

## Not verified yet

- Live route smoke test against Vercel Preview.
- Real Import API credential creation UI.
- Connector workers.
- Scheduled sync.
- External record normalization into canonical validation/consolidation.

## Blockers

- Configure `IMPORT_API_TOKEN_HASH_SECRET` in Vercel Preview before testing the
  route.
- Use a Supabase pooler/session-pooler `DATABASE_URL` if direct database
  connectivity fails in local/serverless environments.
