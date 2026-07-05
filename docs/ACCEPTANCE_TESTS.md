# Acceptance Tests

## Harness acceptance

- All requested repository paths exist.
- `reports/CURRENT_STATE.md` names Phase 0 and accurately records the current implementation mode.
- `AGENTS.md` contains mission, roadmap, active-phase control, Security Grade AAA+, harness standard, workflow, phase gates, prohibitions, validation, and handoff format.
- Future phases are documentation-only.
- Placeholder scripts execute safely and state their incomplete scope.
- CI exposes lint, typecheck, test, build, and security jobs/steps without claiming an absent application was validated.
- No secrets, service-role browser usage, static dashboard data, or fake product screens are present.

## Secure-foundation acceptance

- An unauthenticated user cannot access tenant data.
- A user without membership cannot access an organization by changing client input.
- Tenant A cannot select, insert, update, delete, or subscribe to Tenant B data.
- Roles produce the documented allow/deny outcomes in UI, API, and database tests.
- Service-role credentials are absent from client bundles and public environment variables.
- Organization creation/invitation is validated, idempotent where retried, and audited.
- RLS is enabled and policy coverage is verified for every tenant table.
- Security tests fail when a representative tenant filter, API guard, or RLS policy is removed.

## Current evidence

- Local lint, strict TypeScript, unit, integration, security, dependency audit, and production build pass.
- The embedded PostgreSQL integration suite creates two authenticated users and organizations, verifies own-tenant reads/updates, denies cross-tenant reads/updates, denies anonymous table access, denies direct membership writes, and verifies atomic onboarding/audit behavior.
- Source-boundary tests verify that server-only variable names are unreachable from browser modules and protected onboarding code reauthorizes on the server.
- The reviewed migration is applied to non-production `retailos-dev`; synthetic live Auth, onboarding, audit, RBAC, anonymous denial, and two-tenant RLS verification pass with cleanup.
- Confirm-email signups, an eight-character minimum password, and exact local confirmation callback URLs are configured.
- Hosted token-hash template activation, migration-history reconciliation, Vercel Git linkage, and a protected preview flow remain unverified release blockers.

## Evidence rules

Acceptance evidence must name the environment, commit, command or scenario, outcome, and retained artifact. Placeholder, skipped, or not-yet-applicable checks are reported honestly and cannot satisfy a later product gate.
