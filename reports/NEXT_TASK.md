Next Task:
Phase 0.5 — Integration Hub MVP:
- Review and merge the Integration Hub schema/security foundation PR.
- Apply the reviewed Phase 0.5 migration to hosted Supabase after PR acceptance.
- Update hosted schema verification for Phase 0.5 tables and RPCs after the migration is applied.
- Build Integration Hub UI only after schema/RLS foundation is accepted.
- Build RetailOS Import API only after API authentication/idempotency details are reviewed.
- Build Shopify, WooCommerce, and Google Sheets connector scaffold or MVP only within Phase 0.5 scope.
- Ensure sync output flows back through the existing validation, consolidation, and intelligence pipeline.
- Keep the rule that RetailOS connects to the system behind a website, not to "a website" directly.

Verified:
- Phase 0 foundation is implemented, deployed, and validated.
- Hosted setup/onboarding is user-verified.
- Hosted Phase 0 schema verification passes.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Supabase migration history is repaired for the seven applied Phase 0 migrations.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.

Do not build outside Phase 0.5. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
