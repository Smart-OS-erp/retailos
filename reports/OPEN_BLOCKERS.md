# Open Blockers

## Phase 0.5 implementation blockers

- **Connector credential handling must be designed before any real connector authentication.** Do not paste or commit Shopify, WooCommerce, Google, webhook, SMTP, Supabase, or database secrets. Owner/action: engineering must use managed environment variables and server-only boundaries.
- **Connector depth must be selected per provider.** Phase 0.5 allows Shopify, WooCommerce, and Google Sheets connector scaffold or MVP. Owner/action: product/engineering must record whether each connector is scaffold-only or functional MVP before implementation.
- **Sync retry/rollback behavior must be explicit before scheduled sync behavior.** Owner/action: engineering must define retry limits, worker rollback behavior, and downstream normalization failure handling before enabling scheduled sync workers.
- **RetailOS Import API authenticated live smoke is blocked by the deployed `DATABASE_URL`.** Vercel Production/Preview env vars are now configured and the production login page renders, but authenticated Import API smoke returns `500 internal_error`. Vercel runtime logs for correlation `447898ef-0505-45c7-aaa5-1afe3364fa5e` show `getaddrinfo ENOTFOUND db.djvqhjgkcljdiuicdtpx.supabase.co`. Owner/action: replace Vercel `DATABASE_URL` with the approved Supabase pooler/session-pooler connection string, redeploy, then rerun `npm run smoke:import-api`.
- **Direct `DATABASE_URL` is not reliable in this environment.** Local and Vercel direct-host checks fail against `db.djvqhjgkcljdiuicdtpx.supabase.co`. Owner/action: use Supabase pooler/session-pooler connection strings for local and serverless route testing.

## Verified Phase 0 acceptance controls

- Phase 0 foundation is implemented, deployed, and validated.
- The reviewed foundation schema is applied to `retailos-dev`.
- The reviewed Phase 0 expansion/data/consolidation/intelligence/projectisation/Copilot migrations are applied to `retailos-dev`.
- The reviewed Phase 0.5 Integration Hub migration is applied to `retailos-dev`.
- Integration Hub UI/data-source setup flow is merged in PR #13.
- RetailOS Import API authentication/idempotency/security boundary is merged in PR #14.
- RetailOS Import API credential/control-plane foundation is merged in PR #15, applied to hosted Supabase, and verified.
- Required Vercel Production/Preview env vars are configured.
- Vercel production deployment `dpl_BUZbXGDfqxsezMevAY3jfqaR6mEG` is READY, protected, and aliased to `https://retailos-ten.vercel.app`.
- Protected root route renders the RetailOS login page.
- Unauthenticated Import API POST fails closed with `401 authentication_required`.
- Supabase migration history is repaired for all seven applied Phase 0 migrations plus the applied Phase 0.5 migrations.
- `npm run test:live-phase0-schema` passes against hosted Supabase after Import API credential migration: 43 relation/view endpoints and 15 RPC endpoints are visible.
- `npm run test:live-supabase` passes against hosted Supabase after migration-history repair: Auth, atomic organization creation, onboarding, audit visibility, RBAC denial, anonymous denial, and two-tenant RLS are verified.
- PR #4, PR #5, PR #6, PR #7, PR #8, PR #9, PR #10, PR #11, PR #12, PR #13, PR #14, PR #15, and PR #16 are merged.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only; custom SMTP/eligible plan support remains a production follow-up if the committed token-hash template is required.
- Production governance is accepted by founder instruction on 2026-07-12.
- Synthetic records created by live harness checks were removed by cleanup.
- Vercel project protection reports protected preview behavior, and Git fork protection is enabled.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain Phase 0 intelligence decisions. Phase 0.5 does not authorize changing them except as needed to consume newly synchronized validated data through the existing pipeline.

Phase 0.5 does not authorize POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
