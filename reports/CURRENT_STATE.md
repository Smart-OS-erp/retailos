Project: RetailOS
Active Phase: Phase 0.5 — Integration Hub MVP
Current Mode: Phase 0.5 Milestone 10 — Hosted migration verified, production deployment confirmed
Build Status: Integration Hub schema/RLS foundation is implemented, merged, applied to hosted Supabase, and verified. Integration Hub setup UI is merged. RetailOS Import API boundary is merged. Import API credential/control-plane foundation is merged, applied to hosted Supabase, and verified. `/api/import/v1/records` is deployed on Vercel production. Required Vercel Production variables are configured, latest production deployment `dpl_BTqoLLktbEcaHZVMMWJULHQ3XWXe` is READY, and the protected root route renders the RetailOS login page. Unauthenticated Import API POST fails closed with `401 authentication_required`. Authenticated tenant-scoped Import API smoke previously passed against production. Shopify, WooCommerce, and Google Sheets are now approved to move from scaffold-only to Phase 0.5 MVP connector depth, while staying credential-gated and server-only. POS/ERP and custom backend remain scaffold/import-API paths. Hosted Supabase pending Milestone 7/8/9 migrations were applied through Supabase SQL Editor on 2026-07-15 and hosted schema/RLS verification now passes for 44 relation/view endpoints and 16 RPC endpoints. The pipeline handoff maps `inventory_snapshot`, `product_master`, `store_master`, and `sales_history` external records into persisted upload/raw/validation evidence without writing directly to canonical inventory, products, locations, sales, intelligence, or projectisation tables. Real provider credential setup, live provider API workers, scheduled workers, product/location/sales canonical write approval flows, automatic intelligence recalculation from normalized uploads, and post-migration Import API smoke are not complete yet.
Next Required Step: Provide/import the ignored local Import API smoke secret through approved secret management, rerun `npm run smoke:import-api -- --url https://retailos-ten.vercel.app`, then implement one provider-specific MVP worker at a time.

Verified:
- Phase 0 foundation is implemented, deployed, and validated.
- Hosted setup/onboarding is user-verified.
- Hosted Phase 0 schema verification passes.
- Hosted Phase 0.5 Integration Hub migration is applied to `retailos-dev`.
- Hosted Phase 0.5 pending migrations are applied to `retailos-dev`:
  - `20260715133000_phase0_5_pipeline_handoff.sql`
  - `20260715143000_phase0_5_record_type_mappings.sql`
  - `20260715152000_phase0_5_provider_mvp_promotion.sql`
- Hosted Phase 0/0.5 schema verification passes for 44 relation/view endpoints and 16 RPC endpoints.
- Integration Hub UI/data-source setup flow is merged in PR #13.
- RetailOS Import API authentication/idempotency/security boundary is merged in PR #14.
- Import API credential/control-plane foundation is merged in PR #15, applied to hosted Supabase, and verified.
- Import API route is merged in PR #16 and deployed on Vercel `main`.
- Vercel production deployment `dpl_BTqoLLktbEcaHZVMMWJULHQ3XWXe` is READY and aliased to `https://retailos-ten.vercel.app`.
- Protected production root route renders the RetailOS login page.
- Unauthenticated Import API POST fails closed with `401 authentication_required`.
- Authenticated Import API smoke previously passed against production: tenant-scoped credential creation, external record acceptance/persistence, idempotent replay, and cleanup were verified.
- Connector depth decisions are updated: Shopify, WooCommerce, and Google Sheets are MVP-approved but credential-gated; Import API is the approved live ingestion path.
- Sync retry/rollback behavior is documented before scheduled sync workers are enabled.
- Phase 0.5 pipeline handoff is implemented and hosted schema-visible for `inventory_snapshot`, `product_master`, `store_master`, and `sales_history` external records.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Post-merge production deployment inspection on 2026-07-15 confirms `dpl_BTqoLLktbEcaHZVMMWJULHQ3XWXe` is READY.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.

Do not build outside Phase 0.5. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
