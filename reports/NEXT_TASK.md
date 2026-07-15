Next Task:
Phase 0.5 — Integration Hub MVP:
- Record connector depth decisions for Shopify, WooCommerce, and Google Sheets: scaffold-only or functional MVP.
- Define retry limits, rollback behavior, and downstream normalization failure handling before enabling scheduled sync workers.
- Build the next approved Shopify, WooCommerce, or Google Sheets connector scaffold/MVP only within Phase 0.5 scope.
- Ensure sync output flows back through the existing validation, consolidation, and intelligence pipeline without writing directly to canonical inventory/intelligence tables.
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
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Supabase migration history is repaired for the seven applied Phase 0 migrations plus the applied Phase 0.5 migration.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.

Do not build outside Phase 0.5. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
