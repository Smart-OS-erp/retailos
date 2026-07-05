# Open Blockers

## Release blockers

- **Confirmation template cannot be customized on the current hosted email service.** The non-production project requires custom SMTP or an eligible Supabase plan before the token-hash template can replace the default `ConfirmationURL` template. Owner/action: environment owner selects and configures the approved delivery option without sharing credentials in chat; engineering then verifies valid, invalid, expired, and replayed links.
- **Migration history is not reconciled.** The reviewed migration was applied successfully to `retailos-dev` through SQL Editor because CLI management authentication was unavailable and the direct database hostname was unreachable from this environment. Owner/action: authenticate Supabase CLI and run the reviewed migration-history repair before a later `db push`.
- **Protected preview is not deployed.** The `retailos` Vercel project exists, all four required variables are scoped to Preview, server-only values are sensitive, Vercel Authentication protects deployment URLs, and Git fork protection is enabled. Git linkage is blocked until the account completes its GitHub login connection; the GitHub authorization screen currently keeps its Authorize action disabled. No active deployment remains. Owner/action: account owner completes or repairs the Vercel–GitHub login connection and connects `Smart-OS-erp/retailos`; engineering then deploys the feature branch and runs smoke/security checks.

## Verified non-production controls

- The reviewed foundation schema is applied to `retailos-dev`.
- Confirm-email signups are enabled, the password minimum is eight characters, and exact localhost/127.0.0.1 confirmation callbacks are allowlisted.
- Synthetic Auth, atomic onboarding, audit visibility, RBAC denial, anonymous denial, and two-tenant RLS isolation passed; all synthetic records were removed by the test harness.
- The Vercel project has Preview-scoped configuration only; production variables were intentionally not populated with non-production values.
- Vercel project protection reports `all_except_custom_domains`, and Git fork protection is enabled.

## Production governance blockers

- Name privacy/legal, retention/deletion, incident-response, and environment owners before real tenant or personal data.
- Approve MFA/recovery policy, monitoring/alerting, backups, restoration, and rollback evidence before production.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain future Phase 0 decisions. They do not authorize product implementation in this foundation change.
