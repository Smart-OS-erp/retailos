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
