Next Task:
Phase 0.5 — Integration Hub MVP:
- After this provider MVP promotion work is reviewed and merged, apply the pending Phase 0.5 hosted migrations:
  - `20260715133000_phase0_5_pipeline_handoff.sql`
  - `20260715143000_phase0_5_record_type_mappings.sql`
  - `20260715152000_phase0_5_provider_mvp_promotion.sql`
- Run hosted schema/RLS verification after the migrations are applied.
- Run a hosted Import API ingestion + normalization acceptance smoke.
- Verify Shopify, WooCommerce, and Google Sheets create `mvp` data sources while remaining credential-gated.
- Keep POS/ERP and custom backend scaffold/import-API paths unless a later phase explicitly approves direct connectors.
- Keep the rule that RetailOS connects to the system behind a website, not to "a website" directly.

Verified:
- Phase 0 foundation is implemented, deployed, and validated.
- Hosted setup/onboarding is user-verified.
- Hosted Phase 0 schema verification passes.
- Hosted Phase 0.5 migration is applied to `retailos-dev`.
- Hosted Phase 0/0.5 schema verification passes for 40 relation/view endpoints and 13 RPC endpoints.
- Integration Hub UI/data-source setup flow is merged in PR #13.
- RetailOS Import API authentication/idempotency/security boundary is merged in PR #14.
- Import API credential/control-plane foundation is merged in PR #15, applied to hosted Supabase, and verified.
- Hosted Phase 0/0.5 schema verification now passes for 43 relation/view endpoints and 15 RPC endpoints.
- Import API route is merged in PR #16 and deployed on Vercel `main`.
- Required Vercel Production/Preview environment variables are configured.
- Vercel production deployment `dpl_DPMjtQr8GhR4fo2ft5Mt6BHkwAMo` is READY and aliased to `https://retailos-ten.vercel.app`.
- Protected production root route renders the RetailOS login page.
- Unauthenticated Import API POST fails closed with `401 authentication_required`.
- Authenticated Import API smoke passed against production: tenant-scoped credential creation, external record acceptance/persistence, idempotent replay, and cleanup were verified.
- Connector depth decisions are updated: Shopify, WooCommerce, and Google Sheets are MVP-approved but credential-gated; Import API is the approved live ingestion path.
- Sync retry/rollback behavior is documented before scheduled sync workers are enabled.
- Phase 0.5 pipeline handoff is implemented locally for `inventory_snapshot`, `product_master`, `store_master`, and `sales_history` external records and covered by integration tests.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Supabase migration history is repaired for the seven applied Phase 0 migrations plus the applied Phase 0.5 migration.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.

Do not build outside Phase 0.5. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
