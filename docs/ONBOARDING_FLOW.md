# Onboarding Flow

The secure technical foundation implements the first onboarding skeleton: an authenticated user creates one organization through an atomic database function that also creates an owner membership and audit event.

## Minimal Phase 0 flow

1. A user authenticates through an approved Supabase Auth method.
2. The server establishes a session using secure, HTTP-only cookie handling appropriate to Next.js and Supabase SSR.
3. The user creates an organization with a validated name and globally unique slug.
4. The database creates an `ORG_OWNER` membership and audit event in the same transaction.
5. The system confirms authorization through server checks and RLS before returning tenant data.

Invitations, currency, timezone, locations, data-use review, and inventory-source setup are not implemented in this skeleton.

## Security requirements

- Organization creation and invitation acceptance are server-authorized operations.
- Membership cannot be self-elevated through client-controlled role values.
- Invites expire, are single-use, and bind to the intended organization and recipient where possible.
- Duplicate, interrupted, and retried requests are idempotent.
- Audit events record organization creation, invitation issuance/acceptance, membership and role changes.
- Tenant resources remain inaccessible until a valid membership exists.

## Non-goals

No commerce-channel connection, staff bulk import, billing, catalogue builder, dashboard, or polished onboarding wizard belongs to this foundation milestone. Future screens require a separate approved implementation plan.
