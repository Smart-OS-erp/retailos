# Open Blockers

## Protected-demo release blockers

- None currently identified for the protected non-production Phase 0 demo. The current Supabase hosted confirmation email behavior was explicitly accepted for this protected demo on 2026-07-12.

## Verified non-production controls

- The reviewed foundation schema is applied to `retailos-dev`.
- The reviewed Phase 0 expansion/data/consolidation/intelligence/projectisation/Copilot migrations are applied to `retailos-dev`.
- Supabase migration history is repaired for all seven applied Phase 0 migrations.
- `npm run test:live-phase0-schema` passes against hosted Supabase after migration-history repair: 34 relation/view endpoints and 11 RPC endpoints are visible.
- `npm run test:live-supabase` passes against hosted Supabase after migration-history repair: Auth, atomic organization creation, onboarding, audit visibility, RBAC denial, anonymous denial, and two-tenant RLS are verified.
- PR #4, PR #5, PR #6, PR #7, and PR #8 are merged.
- Vercel deployment `dpl_4q1sLUx6X9n7vBZPbQRrBbV32Uac` for PR #5 reached READY.
- Vercel deployment `dpl_64jVS5hFwxSveS1kaFaybQXsJXfu` for main reached READY.
- The deployed login page responds through Vercel.
- User-reported hosted setup/onboarding flow is successful after the location code-normalization fix.
- Supabase Auth redirect URLs include the branch confirmation callback used during protected preview testing.
- Confirm-email signups are enabled, the password minimum is eight characters, and exact localhost/127.0.0.1 confirmation callbacks are allowlisted.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only; custom SMTP/eligible plan support remains a production follow-up, not a protected-demo blocker.
- Synthetic records created by live harness checks were removed by cleanup.
- Vercel project protection reports protected preview behavior, and Git fork protection is enabled.

## Production governance blockers

- Name privacy/legal, retention/deletion, incident-response, and environment owners before real tenant or personal data.
- Approve MFA/recovery policy, monitoring/alerting, backups, restoration, and rollback evidence before real tenant or personal data.
- Production email confirmation behavior must be approved before production launch; custom SMTP/eligible plan support remains the expected path if the committed token-hash template is required.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain future Phase 0 decisions. They do not authorize Phase 0.5 or future-phase implementation.
