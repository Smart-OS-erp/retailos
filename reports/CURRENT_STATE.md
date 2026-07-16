Project: RetailOS
Active Phase: Phase 0.5 — Integration Hub MVP
Active Milestone: M0-UI — RetailOS UI Foundation Implementation

Current Production Commit: d19a4635d32bfc5b0d26916e3efbd8603e751372
Current Production Deployment: dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE
Production URL: https://retailos-ten.vercel.app

Implementation Status:
- Phase 0 foundation routes, onboarding, data intake, validation, consolidation, inventory recovery, projectisation, deterministic Copilot, and workspaces exist in code.
- Phase 0.5 Integration Hub setup UI, data-source RPCs, Import API route, Import API credential/control-plane, external-record storage, sync jobs/errors, normalization handoff, provider MVP promotion, and Shopify MVP worker exist in `main`.
- M0-UI foundation work is in progress on branch `m0-ui-foundation-implementation`.
- M0-UI adds shared frontend primitives only: shadcn/ui-compatible foundation, design tokens, app shell/topbar/navigation primitives, tenant market formatting, status presentation, RetailDataGrid, reusable state/card/feed/location primitives, documentation, and tests.
- Shopify worker is server-only and credential-gated. WooCommerce worker, Google Sheets worker, scheduled workers, provider credential setup UI/OAuth, product/location/sales canonical write approval flows, and automatic intelligence recalculation from normalized uploads are not complete.

Verification Status:
- Vercel production deployment `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE` is READY and aliased to `https://retailos-ten.vercel.app`.
- Production `/login` and `/signup` return 200.
- Production `/workspace` redirects unauthenticated users to `/login`.
- Fresh Import API production smoke passed on July 16, 2026 after correcting Production `DATABASE_URL` and redeploying.
- Post-smoke runtime log inspection for the current production deployment found no error/fatal logs in the inspected window.
- Vercel Node runtime setting is aligned to `22.x`.
- `npm run test:live-phase0-schema` passed during M0-R for 44 relation/view endpoints and 16 RPC endpoints.
- `npm run test:live-supabase` passed during M0-R for Auth, onboarding, audit, RBAC, and two-tenant RLS.
- M0-UI local typecheck, focused unit tests, and lint have passed during implementation; full validation must pass before handoff.
- GitHub `main` branch is currently unprotected; secret scanning and push protection are enabled; Dependabot security updates are disabled.

Database Migration Status:
- Repository contains 12 Supabase migrations from secure foundation through Phase 0.5 provider MVP promotion.
- M0-UI does not add database migrations.
- Hosted schema/RLS verification passed during M0-R.
- Supabase CLI is not installed in this shell, so `supabase migration list`, `supabase db reset`, and CLI migration-history reconciliation remain unverified.
- No destructive production database operation is authorized or performed.

Known Runtime Issues:
- Earlier production Import API failures were caused by invalid Production `DATABASE_URL` values: DNS lookup failures and password authentication failure for user `postgres`.
- The July 16, 2026 failure on deployment `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZL` had correlation ID `f9424e58-9bad-4b9e-8300-db956923fafa`.
- Resolution: Production `DATABASE_URL` was replaced from ignored local secret management, production was redeployed as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`, and fresh Import API smoke passed.

Current Mode:
- Implement the approved RetailOS UI Foundation milestone after M0-R acceptance.
- Do not finalize navigation taxonomy, dashboard KPIs, roles, statuses, supplier/warehouse/finance terminology, demo businesses, demo values, or other retail-domain assumptions during M0-UI.
- Do not add dashboards as final product screens, new providers, future phases, POS, finance, wholesale, warehouse management, forecasting, marketplace publishing, autonomous campaign execution, or real LLM agent execution.

Next Required Milestone:
- Review and accept M0-UI PR before broad Phase 0/0.5 UI expansion.
