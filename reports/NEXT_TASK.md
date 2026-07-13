Next Task:
Phase 0.5 — Integration Hub MVP:
- Configure required Vercel environment variables for the deployed `main` environment:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL`
  - `IMPORT_API_TOKEN_HASH_SECRET`
- Redeploy `main` after environment variables are configured.
- Smoke test `/api/import/v1/records` with a tenant-scoped Import API credential, idempotency key, and external record payload.
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
- RetailOS Import API authentication/idempotency/security boundary is merged in PR #14.
- Import API credential/control-plane foundation is merged in PR #15, applied to hosted Supabase, and verified.
- Hosted Phase 0/0.5 schema verification now passes for 43 relation/view endpoints and 15 RPC endpoints.
- Import API route is merged in PR #16 and deployed on Vercel `main`.
- Vercel runtime logs for deployment `dpl_44onMWWCzfNueCA84dUZvoGnDCdc` show production is blocked by missing `NEXT_PUBLIC_SUPABASE_URL`.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Supabase migration history is repaired for the seven applied Phase 0 migrations plus the applied Phase 0.5 migration.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.

Do not build outside Phase 0.5. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
