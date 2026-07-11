# Open Blockers

## Release blockers

- **Hosted confirmation template decision remains open.** The current Supabase hosted email service may not allow replacing the default confirmation template with the committed token-hash template unless custom SMTP or an eligible Supabase plan is configured. Owner/action: environment owner either explicitly accepts the current hosted confirmation behavior for the protected non-production demo or configures approved SMTP/plan support without sharing credentials in chat; engineering then verifies valid, invalid, expired, and replayed links.
- **Migration history is not reconciled.** The reviewed Phase 0 migrations were applied to `retailos-dev` through SQL Editor because CLI management authentication was unavailable and the direct database hostname was unreachable from this environment. Owner/action: authenticate Supabase CLI and run the official migration-history repair before a later `supabase db push`; if CLI repair remains unavailable, run the reviewed SQL Editor fallback in `supabase/repair_migration_history.sql` after hosted schema/RLS checks pass.

## Verified non-production controls

- The reviewed foundation schema is applied to `retailos-dev`.
- The reviewed Phase 0 expansion/data/consolidation/intelligence/projectisation/Copilot migrations are applied to `retailos-dev`.
- `npm run test:live-phase0-schema` passes against hosted Supabase: 34 relation/view endpoints and 11 RPC endpoints are visible.
- `npm run test:live-supabase` passes against hosted Supabase: Auth, atomic organization creation, onboarding, audit visibility, RBAC denial, anonymous denial, and two-tenant RLS are verified.
- PR #4 and PR #5 are merged.
- Vercel deployment `dpl_4q1sLUx6X9n7vBZPbQRrBbV32Uac` for PR #5 reached READY.
- Vercel deployment `dpl_64jVS5hFwxSveS1kaFaybQXsJXfu` for main reached READY.
- The deployed login page responds through Vercel.
- User-reported hosted setup/onboarding flow is successful after the location code-normalization fix.
- Supabase Auth redirect URLs include the branch confirmation callback used during protected preview testing.
- Confirm-email signups are enabled, the password minimum is eight characters, and exact localhost/127.0.0.1 confirmation callbacks are allowlisted.
- Synthetic records created by live harness checks were removed by cleanup.
- Vercel project protection reports protected preview behavior, and Git fork protection is enabled.

## Production governance blockers

- Name privacy/legal, retention/deletion, incident-response, and environment owners before real tenant or personal data.
- Approve MFA/recovery policy, monitoring/alerting, backups, restoration, and rollback evidence before real tenant or personal data.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain future Phase 0 decisions. They do not authorize Phase 0.5 or future-phase implementation.
