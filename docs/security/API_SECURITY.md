# API Security

## Route contract

Every non-public route declares authentication requirement, permission, resource/tenant resolution, request and response schema, rate/size limit, idempotency needs, side effects, audit behavior, and safe error model.

## Controls

- Default deny; public routes are explicitly allowlisted and reviewed.
- Validate content type, body, params, query, and output at the server boundary.
- Authorize the actual resource after lookup; do not rely on obscured identifiers.
- Use bounded pagination and query cost; prevent mass assignment and excessive data exposure.
- Apply CSRF protection to cookie-authenticated state changes according to framework architecture.
- Restrict CORS to required trusted origins; never combine wildcard origins with credentials.
- Use rate limits and abuse detection appropriate to identity, tenant, route, and cost.
- Return stable, non-sensitive errors and correlation IDs; keep diagnostic detail server-side.
- Verify webhook signatures against the raw body, reject replays, and process idempotently.

The API-route scanner is initially heuristic and cannot replace route-level tests or review.

## RetailOS Import API boundary

The Phase 0.5 Import API must follow `docs/IMPORT_API_BOUNDARY.md`.

Before `/api/import/v1/records` is implemented, the project must have reviewed:

- server-only import token generation;
- hashed token storage;
- tenant scope derived from credential lookup;
- required `Idempotency-Key`;
- request and record payload limits;
- replay and duplicate behavior;
- rate limits;
- audit events;
- negative tests for anonymous, wrong-token, revoked-token, cross-tenant,
  malformed, oversized, duplicate, and unsupported-record requests.

Import API requests must never trust caller-supplied `organization_id` and must
not write directly to canonical inventory, sales, intelligence, or
projectisation tables.
