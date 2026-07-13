# Open Blockers

## Phase 0.5 implementation blockers

- **Connector credential handling must be designed before any real connector authentication.** Do not paste or commit Shopify, WooCommerce, Google, webhook, SMTP, Supabase, or database secrets. Owner/action: engineering must use managed environment variables and server-only boundaries.
- **Connector depth must be selected per provider.** Phase 0.5 allows Shopify, WooCommerce, and Google Sheets connector scaffold or MVP. Owner/action: product/engineering must record whether each connector is scaffold-only or functional MVP before implementation.
- **Sync retry/rollback behavior must be explicit before scheduled sync behavior.** Owner/action: engineering must define retry limits, worker rollback behavior, and downstream normalization failure handling before enabling scheduled sync workers.
- **Deployed `main` currently returns 500 because Vercel production env vars are missing.** Owner/action: configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `IMPORT_API_TOKEN_HASH_SECRET` in Vercel for the deployed environment, then redeploy `main`.
- **RetailOS Import API route live smoke test remains blocked until Vercel has `IMPORT_API_TOKEN_HASH_SECRET`.** Owner/action: configure a server-only token hash secret, then create a tenant-scoped Import API credential and test `/api/import/v1/records`.
- **Local direct `DATABASE_URL` is IPv6-only in this environment.** Owner/action: prefer Supabase pooler/session-pooler connection strings for local and serverless route testing if direct DB DNS/connectivity fails.

## Verified Phase 0 acceptance controls

- Phase 0 foundation is implemented, deployed, and validated.
- The reviewed foundation schema is applied to `retailos-dev`.
- The reviewed Phase 0 expansion/data/consolidation/intelligence/projectisation/Copilot migrations are applied to `retailos-dev`.
- The reviewed Phase 0.5 Integration Hub migration is applied to `retailos-dev`.
- Integration Hub UI/data-source setup flow is merged in PR #13.
- RetailOS Import API authentication/idempotency/security boundary is merged in PR #14.
- RetailOS Import API credential/control-plane foundation is merged in PR #15, applied to hosted Supabase, and verified.
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
