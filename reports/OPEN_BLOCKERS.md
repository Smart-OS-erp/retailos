# Open Blockers

## Release blockers

- **Confirmation template cannot be customized on the current hosted email service.** The non-production project requires custom SMTP or an eligible Supabase plan before the token-hash template can replace the default `ConfirmationURL` template. Owner/action: environment owner selects and configures the approved delivery option without sharing credentials in chat; engineering then verifies valid, invalid, expired, and replayed links.
- **Supabase Auth hosted redirect allowlist must include the deployed preview confirmation URL.** App code now supplies `/auth/confirm`, but Supabase may reject non-localhost redirect URLs unless the branch alias or preview domain is allowlisted. Owner/action: add the protected preview/branch alias confirmation URL in Supabase Auth URL configuration, then retry signup with a fresh test email.
- **Hosted Phase 0 migrations are not applied/verified.** Direct Postgres DNS for `DATABASE_URL` is not resolvable from this environment, `psql`, `supabase`, and `vercel` CLIs are unavailable, and the Supabase SQL Editor opened as a blank shell in the in-app browser. Owner/action: environment owner provides working Supabase CLI/SQL Editor access or applies the reviewed migrations from `supabase/migrations/20260706100000_phase0_data_foundation.sql` through `20260706140000_phase0_retail_copilot.sql`; engineering then reruns live tenant/RLS and app smoke checks.
- **Migration history is not reconciled.** The earlier foundation migration was applied successfully to `retailos-dev` through SQL Editor because CLI management authentication was unavailable and the direct database hostname was unreachable from this environment. Owner/action: authenticate Supabase CLI and run the reviewed migration-history repair before a later `db push`.

## Verified non-production controls

- The reviewed foundation schema is applied to `retailos-dev`.
- The protected Vercel preview for PR #4 is deployed and Vercel/GitHub checks are green.
- The in-app browser verified the deployed login page, signup page, and unauthenticated protected-route redirect.
- Confirm-email signups are enabled, the password minimum is eight characters, and exact localhost/127.0.0.1 confirmation callbacks are allowlisted.
- Synthetic Auth, atomic onboarding, audit visibility, RBAC denial, anonymous denial, and two-tenant RLS isolation passed; all synthetic records were removed by the test harness.
- The Vercel project has Preview-scoped configuration only; production variables were intentionally not populated with non-production values.
- Vercel project protection reports `all_except_custom_domains`, and Git fork protection is enabled.

## Production governance blockers

- Name privacy/legal, retention/deletion, incident-response, and environment owners before real tenant or personal data.
- Approve MFA/recovery policy, monitoring/alerting, backups, restoration, and rollback evidence before production.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain future Phase 0 decisions. They do not authorize product implementation in this foundation change.
