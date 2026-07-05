# Onboarding Flow

This is a behavioral specification for the post-harness technical foundation. No onboarding UI or route is implemented yet.

## Minimal Phase 0 flow

1. A user authenticates through an approved Supabase Auth method.
2. The server establishes a session using secure, HTTP-only cookie handling appropriate to Next.js and Supabase SSR.
3. The user creates an organization or accepts a time-bound, single-use invitation.
4. A membership is created with the least-privileged approved role.
5. Organization identity, primary currency, timezone, and operating location basics are captured.
6. The user reviews data-use and inventory-source requirements.
7. The system confirms authorization before exposing any tenant-scoped setup or data.

## Security requirements

- Organization creation and invitation acceptance are server-authorized operations.
- Membership cannot be self-elevated through client-controlled role values.
- Invites expire, are single-use, and bind to the intended organization and recipient where possible.
- Duplicate, interrupted, and retried requests are idempotent.
- Audit events record organization creation, invitation issuance/acceptance, membership and role changes.
- Tenant resources remain inaccessible until a valid membership exists.

## Non-goals

No commerce-channel connection, staff bulk import, billing, catalogue builder, or polished onboarding wizard belongs to the harness milestone. Future screens require a separate approved implementation plan.
