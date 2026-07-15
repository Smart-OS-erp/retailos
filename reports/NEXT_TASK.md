Next Task:
Phase 0.5 — Integration Hub MVP:
- Correct the deployed Vercel `DATABASE_URL` with the exact approved Supabase pooler/session-pooler username and password. The database host is now reachable, but Postgres rejects the credentials with `28P01 password authentication failed for user "postgres"`.
- Redeploy production after `DATABASE_URL` is updated.
- Rerun `npm run smoke:import-api -- --url <protected Vercel share URL> --env <ignored env file>` to smoke test `/api/import/v1/records` with a tenant-scoped Import API credential, idempotency key, external record payload, persistence verification, and idempotent replay.
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
- Required Vercel Production/Preview environment variables are configured.
- Vercel production deployment `dpl_BUZbXGDfqxsezMevAY3jfqaR6mEG` is READY and aliased to `https://retailos-ten.vercel.app`.
- Protected production root route renders the RetailOS login page.
- Unauthenticated Import API POST fails closed with `401 authentication_required`.
- Authenticated Import API smoke reaches app code and the configured database host, but is blocked by `DATABASE_URL` authentication: Vercel runtime logs for deployment `dpl_6UuUssxFcTGKb9on9aKREtnuoXG7` and correlation `82fb1f6b-a406-4272-8783-cd9c99fd6c1c` show `28P01 password authentication failed for user "postgres"`.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Supabase migration history is repaired for the seven applied Phase 0 migrations plus the applied Phase 0.5 migration.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.

Do not build outside Phase 0.5. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
