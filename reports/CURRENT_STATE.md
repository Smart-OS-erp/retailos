Project: RetailOS
Active Phase: Phase 0.5 — Integration Hub MVP
Current Mode: Phase 0.5 Milestone 11 — Shopify MVP worker in progress
Build Status: Integration Hub schema/RLS foundation is implemented, merged, applied to hosted Supabase, and verified. Integration Hub setup UI is merged. RetailOS Import API boundary is merged. Import API credential/control-plane foundation is merged, applied to hosted Supabase, and verified. `/api/import/v1/records` is deployed on Vercel production. Required Vercel Production variables are configured, latest production deployment `dpl_D4MdYF9QRAQQwxa83GekhncvcCLZ` is READY, and the protected root route renders the RetailOS login page. Unauthenticated Import API POST fails closed with `401 authentication_required`. Authenticated tenant-scoped Import API smoke passed against production on 2026-07-16 after rotating the Supabase database password and updating Vercel Production `DATABASE_URL` to the working Supabase pooler URL on port `6543`. Shopify, WooCommerce, and Google Sheets are now approved to move from scaffold-only to Phase 0.5 MVP connector depth, while staying credential-gated and server-only. POS/ERP and custom backend remain scaffold/import-API paths. Hosted Supabase pending Milestone 7/8/9 migrations were applied through Supabase SQL Editor on 2026-07-15 and hosted schema/RLS verification now passes for 44 relation/view endpoints and 16 RPC endpoints. The pipeline handoff maps `inventory_snapshot`, `product_master`, `store_master`, and `sales_history` external records into persisted upload/raw/validation evidence without writing directly to canonical inventory, products, locations, sales, intelligence, or projectisation tables. Shopify MVP worker code now exists locally on the current branch: it is server-only, credential-gated through ignored env/secret management, writes Shopify `product_master` and `inventory_snapshot` payloads to `external_records`, and hands off to `normalize_external_records(sync_job_id)` through the authenticated server action. WooCommerce worker, Google Sheets worker, scheduled workers, provider setup UI/OAuth, product/location/sales canonical write approval flows, and automatic intelligence recalculation from normalized uploads are not complete yet.
Next Required Step: Validate and merge the Shopify MVP worker PR. After merge, choose the next Phase 0.5 provider worker or explicitly start M0.9 UI Foundation as a separate Phase 0 implementation PR.

Approved Phase 0 Milestone:
- M0.9 — RetailOS UI Foundation is approved as a Phase 0 milestone for shared frontend system work after this harness update is reviewed and merged.
- M0.9 may establish design tokens, shadcn/ui foundation, shared application shell, responsive navigation/topbar primitives, organization switcher, user menu, global search shell, central navigation/dashboard configuration, tenant defaults, locale/currency/timezone formatting utilities, reusable KPI/chart/activity/status/loading/empty/error primitives, stock-location primitives, RetailDataGrid, accessibility baseline, responsive behavior, documentation, and tests.
- M0.9 does not authorize broad product screens, static dashboards as product truth, final module structure, final workflow terminology, final roles/statuses, purchase-order/finance/EDI product requirements, provider workers, or future-phase implementation.
- Navigation structure, dashboard KPIs, card arrangement, module grouping, terminology, statuses, workflows, roles, locations, suppliers, and demo records introduced during M0.9 are provisional placeholders only. They validate the design system and technical component architecture, remain replaceable, and are not final product requirements until retail-consultant validation and product-discovery decisions approve them.

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
- Vercel production deployment `dpl_D4MdYF9QRAQQwxa83GekhncvcCLZ` is READY and aliased to `https://retailos-ten.vercel.app`.
- Protected production root route renders the RetailOS login page.
- Unauthenticated Import API POST fails closed with `401 authentication_required`.
- Authenticated Import API smoke passed against production on 2026-07-16: tenant-scoped credential creation, one external record acceptance/persistence, idempotent replay, and cleanup were verified.
- Connector depth decisions are updated: Shopify, WooCommerce, and Google Sheets are MVP-approved but credential-gated; Import API is the approved live ingestion path.
- Sync retry/rollback behavior is documented before scheduled sync workers are enabled.
- Phase 0.5 pipeline handoff is implemented and hosted schema-visible for `inventory_snapshot`, `product_master`, `store_master`, and `sales_history` external records.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Post-fix production deployment inspection on 2026-07-16 confirms `dpl_D4MdYF9QRAQQwxa83GekhncvcCLZ` is READY.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.
- M0.9 — RetailOS UI Foundation is approved in harness documentation only; no UI implementation has started in this milestone-approval change.

Do not build outside the selected approved lane. M0.9 does not authorize final dashboards or product screens. Phase 0.5 remains the active Integration Hub lane when selected. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
