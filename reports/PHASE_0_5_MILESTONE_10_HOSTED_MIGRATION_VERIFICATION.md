# Phase 0.5 Milestone 10 — Hosted Migration Verification

## Outcome

The pending Phase 0.5 hosted migrations were applied to `retailos-dev` through Supabase SQL Editor on 2026-07-15.

Applied migrations:

- `20260715133000_phase0_5_pipeline_handoff.sql`
- `20260715143000_phase0_5_record_type_mappings.sql`
- `20260715152000_phase0_5_provider_mvp_promotion.sql`

Supabase SQL Editor returned:

```text
Success. No rows returned
```

## Verification

Passed:

```bash
npm run test:live-phase0-schema
npm run test:live-supabase
```

Observed hosted schema/RLS result:

```text
Live Phase 0/0.5 hosted schema verification passed using server-only service role for 44 relation/view endpoint(s) and 16 RPC endpoint(s).
Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passed.
```

Production deployment:

- Deployment: `dpl_9u2u8YNU6z9u3FQCMydnna2ev3ip`
- URL: `https://retailos-ten.vercel.app`
- Root route redirects to `/onboarding`, then `/login`, final `200 OK`.

## Not verified

The post-migration Import API smoke did not run because ignored local env is missing `IMPORT_API_TOKEN_HASH_SECRET`.

Blocked command:

```bash
npm run smoke:import-api -- --url https://retailos-ten.vercel.app
```

Observed blocker:

```text
Live Import API smoke blocked: missing IMPORT_API_TOKEN_HASH_SECRET.
```

Do not paste the secret into chat. Restore it through ignored env or approved secret management, then rerun the smoke.

## Security notes

- No secrets were printed or committed.
- Vercel Production env pull returned protected placeholders, not secret values.
- The previously exposed database password still needs rotation.
- Provider connectors remain credential-gated; no live Shopify, WooCommerce, or Google Sheets API workers were implemented in this milestone.
