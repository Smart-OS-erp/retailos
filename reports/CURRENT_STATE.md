Project: RetailOS
Active Phase: Phase 0.5 — Integration Hub MVP
Active Milestone: Phase 0.5 — Provider Credential Onboarding

Current Production Commit: d19a4635d32bfc5b0d26916e3efbd8603e751372
Current Production Deployment: dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE
Production URL: https://retailos-ten.vercel.app

Implementation Status:
- Phase 0 foundation routes, onboarding, data intake, validation, consolidation, inventory recovery, projectisation, deterministic Copilot, and workspaces exist in code.
- Phase 0.5 Integration Hub setup UI, data-source RPCs, Import API route, Import API credential/control-plane, external-record storage, sync jobs/errors, normalization handoff, provider MVP promotion, Shopify MVP worker, and M0-UI shared frontend foundation exist in `main`.
- Current branch `phase-0-5-provider-credential-onboarding` adds a narrow server-side Shopify credential availability check for data sources.
- The credential check reads only approved server-side secret material through ignored env/secret management. It does not collect, display, store, or log provider secrets in browser-readable UI.
- WooCommerce worker, Google Sheets worker, scheduled workers, OAuth/provider credential entry UI, product/location/sales canonical write approval flows, and automatic intelligence recalculation from normalized uploads are not complete.

Verification Status:
- Vercel production deployment `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE` is READY and aliased to `https://retailos-ten.vercel.app`.
- Production `/login` and `/signup` return 200.
- Production `/workspace` redirects unauthenticated users to `/login`.
- Fresh Import API production smoke passed on July 16, 2026 after correcting Production `DATABASE_URL` and redeploying.
- Post-smoke runtime log inspection for the current production deployment found no error/fatal logs in the inspected window.
- Vercel Node runtime setting is aligned to `22.x`.
- M0-UI PR #33 was merged with green Quality, Security, and Vercel checks.
- Provider credential onboarding focused typecheck and unit tests passed during implementation; full validation must pass before handoff.
- GitHub `main` branch is currently unprotected; secret scanning and push protection are enabled; Dependabot security updates are disabled.

Database Migration Status:
- Repository contains 12 Supabase migrations from secure foundation through Phase 0.5 provider MVP promotion.
- Provider credential onboarding does not add a database migration; it uses existing `data_sources` status and credential-status fields.
- Hosted schema/RLS verification passed during M0-R.
- Supabase CLI is not installed in this shell, so `supabase migration list`, `supabase db reset`, and CLI migration-history reconciliation remain unverified.
- No destructive production database operation is authorized or performed.

Known Runtime Issues:
- Earlier production Import API failures were caused by invalid Production `DATABASE_URL` values: DNS lookup failures and password authentication failure for user `postgres`.
- The July 16, 2026 failure on deployment `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZL` had correlation ID `f9424e58-9bad-4b9e-8300-db956923fafa`.
- Resolution: Production `DATABASE_URL` was replaced from ignored local secret management, production was redeployed as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`, and fresh Import API smoke passed.

Current Mode:
- Implement provider credential onboarding/status verification for Phase 0.5.
- Do not ask users to paste secrets into chat or browser forms.
- Do not store provider access tokens in `data_sources.connection_metadata`, client code, fixtures, screenshots, docs, or Git.
- Do not add new provider workers, OAuth flows, scheduled sync, future phases, POS, finance, wholesale, warehouse management, forecasting, marketplace publishing, autonomous campaign execution, or real LLM agent execution in this slice.

Next Required Milestone:
- Review and accept the Provider Credential Onboarding PR before continuing to another Phase 0.5 blocker.
