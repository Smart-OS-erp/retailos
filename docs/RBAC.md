# Role-Based Access Control

## Model

Authorization derives from an authenticated user, an organization membership, a role assignment, resource context, and explicit permission. Client UI visibility is convenience only; API and database enforcement remain authoritative.

## Proposed Phase 0 roles

- **Owner:** manages organization-critical configuration, memberships, and all approved Phase 0 capabilities. Owner transfer must be controlled and audited.
- **Admin:** manages operations and members within delegated permissions but cannot silently assume owner-only powers.
- **Inventory Manager:** manages inventory inputs and reviews or approves recovery actions within policy.
- **Analyst:** views permitted inventory intelligence and exports where separately allowed; cannot mutate operational state.
- **Viewer:** read-only access to explicitly granted Phase 0 information.

These roles are a specification pending implementation review. Exact permission identifiers must be enumerated in migrations/application policy, not inferred from labels.

## Enforcement rules

- Default deny for absent, expired, suspended, or cross-tenant memberships.
- Server resolves effective permissions; client-supplied organization IDs and roles are untrusted.
- Privileged membership changes require elevated permission, validation against last-owner removal, audit events, and RLS-safe database operations.
- UI, API, and database tests must cover allowed and denied paths.
- Background jobs carry explicit tenant and permission/service purpose; they do not impersonate broad user access casually.

See `docs/security/AUTHORIZATION_RBAC_RLS.md` for the security contract.
