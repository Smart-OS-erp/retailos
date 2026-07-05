# Authorization: RBAC and RLS

## Core rule

Every tenant operation must satisfy all of: authenticated principal, active organization membership, explicit permission, resource ownership/context, and applicable RLS policy. A client-provided `organization_id` is a claim to validate, not authority.

## Layer responsibilities

- **UI:** hide or disable unavailable actions and explain access state.
- **API/server action:** authenticate, resolve membership, validate input, authorize operation and resource, then use a scoped data access path.
- **Database:** enforce tenant isolation and permitted row operations with RLS, constraints, and carefully reviewed functions.

## RLS policy standard

- Enable and force RLS where appropriate before tenant tables are exposed.
- Policies use stable membership relationships and distinguish `select`, `insert`, `update`, and `delete` needs.
- `WITH CHECK` prevents moving rows into another tenant.
- Security-definer functions are exceptional, search-path-safe, least-privileged, reviewed, and tested.
- No blanket authenticated-user policy may grant every tenant row.

## Evidence

Maintain a permission matrix and automated tests covering each role/action plus unauthenticated, no-membership, suspended-membership, and cross-tenant cases. Test through the same Supabase roles used in production.
