# Open Blockers

## Phase 0.5 implementation blockers

- **Hosted Milestone 7/8/9 migrations are not applied yet.** The pipeline handoff, record-type mapping, and provider MVP promotion migrations exist locally and are integration-tested, but hosted Supabase must be updated. Local apply is currently blocked because ignored `.env.local` points `DATABASE_URL` at the direct Supabase database host, which fails DNS resolution from this environment. Owner/action: update ignored local `DATABASE_URL` to the rotated pooler/session-pooler URL or apply the reviewed SQL through Supabase SQL Editor, then run hosted schema/RLS checks.
- **Connector credential handling must be implemented before any live provider API access.** Do not paste or commit Shopify, WooCommerce, Google, webhook, SMTP, Supabase, or database secrets. Owner/action: engineering must use managed environment variables and server-only boundaries before marking Shopify, WooCommerce, or Google Sheets connected.
- **Provider workers are not implemented yet.** Shopify, WooCommerce, and Google Sheets can now be created as MVP-depth data sources, but live provider API calls and scheduled workers are not implemented. Owner/action: implement one provider-specific worker at a time with credential storage, retries, external record writes, and normalization tests.
- **Product/location/sales canonical write approval flows are not implemented yet.** Import API record types now map into persisted evidence, but product master, store master, and sales history records do not directly mutate canonical products, locations, SKUs, or sales facts. Owner/action: keep as review-gated unless a later active phase approves canonical write workflows.
- **Database password was exposed in chat during unblock.** The pooler `DATABASE_URL` now works for the protected demo, but the password was pasted into the agent conversation. Owner/action: rotate the Supabase database password, update Vercel `DATABASE_URL` with the rotated pooler/session-pooler string, redeploy, and rerun `npm run smoke:import-api`.

## Verified Phase 0 acceptance controls

- Phase 0 foundation is implemented, deployed, and validated.
- The reviewed foundation schema is applied to `retailos-dev`.
- The reviewed Phase 0 expansion/data/consolidation/intelligence/projectisation/Copilot migrations are applied to `retailos-dev`.
- The reviewed Phase 0.5 Integration Hub migration is applied to `retailos-dev`.
- Integration Hub UI/data-source setup flow is merged in PR #13.
- RetailOS Import API authentication/idempotency/security boundary is merged in PR #14.
- RetailOS Import API credential/control-plane foundation is merged in PR #15, applied to hosted Supabase, and verified.
- Required Vercel Production/Preview env vars are configured.
- Vercel production deployment `dpl_DPMjtQr8GhR4fo2ft5Mt6BHkwAMo` is READY, protected, and aliased to `https://retailos-ten.vercel.app`.
- Protected root route renders the RetailOS login page.
- Unauthenticated Import API POST fails closed with `401 authentication_required`.
- Authenticated Import API smoke passed against production: tenant-scoped credential creation, external record acceptance/persistence, idempotent replay, and cleanup were verified.
- Connector depth decisions are updated: Shopify, WooCommerce, and Google Sheets are MVP-approved but credential-gated; Import API is the approved live ingestion path.
- Sync retry/rollback behavior is documented before scheduled sync workers are enabled.
- Local integration tests verify all approved Import API record types map into upload/raw/validation evidence without direct canonical writes.
- Supabase migration history is repaired for all seven applied Phase 0 migrations plus the applied Phase 0.5 migrations.
- `npm run test:live-phase0-schema` passes against hosted Supabase after Import API credential migration: 43 relation/view endpoints and 15 RPC endpoints are visible.
- `npm run test:live-supabase` passes against hosted Supabase after migration-history repair: Auth, atomic organization creation, onboarding, audit visibility, RBAC denial, anonymous denial, and two-tenant RLS are verified.
- PR #4, PR #5, PR #6, PR #7, PR #8, PR #9, PR #10, PR #11, PR #12, PR #13, PR #14, PR #15, PR #16, and PR #21 are merged.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only; custom SMTP/eligible plan support remains a production follow-up if the committed token-hash template is required.
- Production governance is accepted by founder instruction on 2026-07-12.
- Synthetic records created by live harness checks were removed by cleanup.
- Vercel project protection reports protected preview behavior, and Git fork protection is enabled.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain Phase 0 intelligence decisions. Phase 0.5 does not authorize changing them except as needed to consume newly synchronized validated data through the existing pipeline.

Phase 0.5 does not authorize POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
