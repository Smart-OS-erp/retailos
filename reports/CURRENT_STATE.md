Project: RetailOS
Active Phase: Phase 0.5 — Integration Hub MVP
Current Mode: Phase 0.5 Milestone 9 — Provider MVP promotion
Build Status: Integration Hub schema/RLS foundation is implemented, merged, applied to hosted Supabase, and verified. Integration Hub setup UI is merged. RetailOS Import API boundary is merged. Import API credential/control-plane foundation is merged, applied to hosted Supabase, and verified. `/api/import/v1/records` is deployed on Vercel production. Required Vercel Production variables are configured, production redeploy `dpl_DPMjtQr8GhR4fo2ft5Mt6BHkwAMo` is READY, and the protected root route renders the RetailOS login page. Unauthenticated Import API POST fails closed with `401 authentication_required`. Authenticated tenant-scoped Import API smoke passed against production: it created a temporary tenant-scoped credential, accepted one external record, verified persistence, verified idempotent replay, and cleaned up. Shopify, WooCommerce, and Google Sheets are now approved to move from scaffold-only to Phase 0.5 MVP connector depth, while staying credential-gated and server-only. POS/ERP and custom backend remain scaffold/import-API paths. The pipeline handoff maps `inventory_snapshot`, `product_master`, `store_master`, and `sales_history` external records into persisted upload/raw/validation evidence without writing directly to canonical inventory, products, locations, sales, intelligence, or projectisation tables. Hosted migration application for Milestones 7/8 and 9 is blocked locally by a direct-host `DATABASE_URL` DNS failure; use the rotated pooler/session-pooler URL or Supabase SQL Editor. Real provider credential setup, live provider API workers, scheduled workers, product/location/sales canonical write approval flows, and automatic intelligence recalculation from normalized uploads are not implemented yet.
Next Required Step: Review/merge the provider MVP promotion PR, apply the hosted Supabase migrations, run hosted schema/RLS checks, then perform Phase 0.5 acceptance smoke against Import API ingestion plus normalization and credential-gated provider data-source creation.

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
