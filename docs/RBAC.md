# Role-Based Access Control

## Model

Authorization derives from an authenticated user, an organization membership, a role assignment, resource context, and explicit permission. Client UI visibility is convenience only; API and database enforcement remain authoritative.

## Proposed Phase 0 roles

- **ORG_OWNER:** manages organization-critical configuration, memberships, and all approved Phase 0 capabilities. Owner transfer must be controlled and audited.
- **EXECUTIVE:** views organization-wide operating intelligence and approves explicitly delegated recovery actions.
- **MERCHANDISING_MANAGER:** manages inventory inputs and reviews or approves recovery actions within policy.
- **STORE_MANAGER:** works only within assigned location scope and explicitly delegated operational permissions.
- **VIEWER:** read-only access to explicitly granted Phase 0 information.

These roles match the operating manual but remain a specification pending implementation review. Exact permission identifiers and role-to-permission mappings must be enumerated in migrations/application policy, not inferred from labels.

## Enforcement rules

- Default deny for absent, expired, suspended, or cross-tenant memberships.
- Server resolves effective permissions; client-supplied organization IDs and roles are untrusted.
- Privileged membership changes require elevated permission, validation against last-owner removal, audit events, and RLS-safe database operations.
- UI, API, and database tests must cover allowed and denied paths.
- Background jobs carry explicit tenant and permission/service purpose; they do not impersonate broad user access casually.

See `docs/security/AUTHORIZATION_RBAC_RLS.md` for the security contract.
