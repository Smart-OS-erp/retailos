# Acceptance Tests

## Harness acceptance

- All requested repository paths exist.
- `reports/CURRENT_STATE.md` names Phase 0 and says no product implementation exists.
- `AGENTS.md` contains mission, roadmap, active-phase control, Security Grade AAA+, harness standard, workflow, phase gates, prohibitions, validation, and handoff format.
- Future phases are documentation-only.
- Placeholder scripts execute safely and state their incomplete scope.
- CI exposes lint, typecheck, test, build, and security jobs/steps without claiming an absent application was validated.
- No secrets, service-role browser usage, app scaffold, static dashboard data, or UI screens are present.

## Secure-foundation acceptance (next approved task)

- An unauthenticated user cannot access tenant data.
- A user without membership cannot access an organization by changing client input.
- Tenant A cannot select, insert, update, delete, or subscribe to Tenant B data.
- Roles produce the documented allow/deny outcomes in UI, API, and database tests.
- Service-role credentials are absent from client bundles and public environment variables.
- Organization creation/invitation is validated, idempotent where retried, and audited.
- RLS is enabled and policy coverage is verified for every tenant table.
- Security tests fail when a representative tenant filter, API guard, or RLS policy is removed.

## Evidence rules

Acceptance evidence must name the environment, commit, command or scenario, outcome, and retained artifact. Placeholder, skipped, or not-yet-applicable checks are reported honestly and cannot satisfy a later product gate.
