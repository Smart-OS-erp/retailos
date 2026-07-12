Next Task:
Phase 0.5 — Integration Hub MVP:
- Build Integration Hub UI/data-source setup flow against the accepted Phase 0.5 schema/RLS foundation.
- Build RetailOS Import API only after API authentication/idempotency details are reviewed.
- Build Shopify, WooCommerce, and Google Sheets connector scaffold or MVP only within Phase 0.5 scope.
- Ensure sync output flows back through the existing validation, consolidation, and intelligence pipeline.
- Keep the rule that RetailOS connects to the system behind a website, not to "a website" directly.

Verified:
- Phase 0 foundation is implemented, deployed, and validated.
- Hosted setup/onboarding is user-verified.
- Hosted Phase 0 schema verification passes.
- Hosted Phase 0.5 migration is applied to `retailos-dev`.
- Hosted Phase 0/0.5 schema verification passes for 40 relation/view endpoints and 13 RPC endpoints.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Supabase migration history is repaired for the seven applied Phase 0 migrations plus the applied Phase 0.5 migration.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.

Do not build outside Phase 0.5. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
