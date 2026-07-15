Next Task:
Phase 0.5 — Integration Hub MVP:
- Restore the approved local smoke-test secret through ignored env/secret-management only; do not paste it into chat.
- Rerun `npm run smoke:import-api -- --url https://retailos-ten.vercel.app`.
- If smoke passes, document Phase 0.5 hosted acceptance evidence.
- Then implement one provider-specific MVP worker at a time, starting with the highest-priority provider.
- Shopify, WooCommerce, and Google Sheets may create `mvp` data sources, but must remain credential-gated until server-side credential storage and provider workers are implemented.
- Keep POS/ERP and custom backend scaffold/import-API paths unless a later phase explicitly approves direct connectors.
- Keep the rule that RetailOS connects to the system behind a website, not to "a website" directly.

Verified:
- Hosted Phase 0.5 pending migrations are applied:
  - `20260715133000_phase0_5_pipeline_handoff.sql`
  - `20260715143000_phase0_5_record_type_mappings.sql`
  - `20260715152000_phase0_5_provider_mvp_promotion.sql`
- Hosted schema/RLS verification passes for 44 relation/view endpoints and 16 RPC endpoints.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Vercel production deployment `dpl_BTqoLLktbEcaHZVMMWJULHQ3XWXe` is READY.
- Live root route redirects safely to login.

Do not build outside Phase 0.5. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
