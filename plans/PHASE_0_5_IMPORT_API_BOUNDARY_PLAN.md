# Phase 0.5 Import API Boundary Plan

## Objective

Define the security and data contract for the RetailOS Import API before writing
any route handler or credential-management code.

## Approved scope

- Document endpoint shape.
- Document authentication and token-storage rules.
- Document tenant-scope derivation.
- Document idempotency and replay behavior.
- Document payload limits and record types.
- Document audit/error/rate-limit expectations.
- Define required tests for the future implementation PR.

## Out of scope

- API route implementation.
- Import token generation UI.
- Credential table migration.
- Real provider connector work.
- Scheduled workers.
- Normalization jobs.
- Any direct write to canonical inventory or sales tables.

## Decisions recorded

1. Tenant scope is derived from the import credential, never from request body.
2. Import tokens are generated server-side and stored only as hashes.
3. Import credentials are scoped to one organization and one data source.
4. `Idempotency-Key` is required for every request.
5. `external_records` remains the first persistence point.
6. Imported records remain untrusted until validation and consolidation.
7. Service role is not used for normal import traffic.

## Follow-up implementation sequence

1. Add import credential schema and RLS/security tests.
2. Add server-only token generation and revocation actions.
3. Add `/api/import/v1/records` with strict request validation.
4. Add idempotency persistence and duplicate handling.
5. Add external-record insertion and sync error behavior.
6. Add pipeline normalization handoff in a later PR.

## Validation for this design PR

Run repository gates even though this is documentation-only:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run security
```
