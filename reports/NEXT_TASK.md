Next Task:
Phase 0.5 — Integration Hub MVP:
- Review and merge the RetailOS Import API authentication/idempotency/security boundary.
- Build the Import API schema/credential foundation only after the boundary is accepted.
- Build `/api/import/v1/records` only after import credential storage, tenant scoping, replay handling, idempotency keys, rate limits, and audit evidence are implemented and tested.
- Build Shopify, WooCommerce, and Google Sheets connector scaffold or MVP only within Phase 0.5 scope.
- Ensure sync output flows back through the existing validation, consolidation, and intelligence pipeline.
- Keep the rule that RetailOS connects to the system behind a website, not to "a website" directly.

Verified:
- Phase 0 foundation is implemented, deployed, and validated.
- Hosted setup/onboarding is user-verified.
- Hosted Phase 0 schema verification passes.
- Hosted Phase 0.5 migration is applied to `retailos-dev`.
- Hosted Phase 0/0.5 schema verification passes for 40 relation/view endpoints and 13 RPC endpoints.
- Integration Hub UI/data-source setup flow is merged in PR #13.
- RetailOS Import API authentication/idempotency/security boundary is documented locally on branch `phase-0-5-import-api-boundary` and pending review.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Supabase migration history is repaired for the seven applied Phase 0 migrations plus the applied Phase 0.5 migration.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.

Do not build outside Phase 0.5. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
