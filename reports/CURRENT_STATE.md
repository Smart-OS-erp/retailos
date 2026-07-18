Project: RetailOS
Active Phase: Phase 0.5 — Integration Hub MVP
Active Milestone: Phase 0.5 — Canonical Write Approval Flows

Current Production Commit: 562e159594d66dfec594fb53d1aacfdc0a473191
Current Production Deployment: dpl_GfAHEeA1fDPgbZrNwYv6mat9LsvZ
Production URL: https://retailos-ten.vercel.app

Implementation Status:
- Phase 0 foundation routes, onboarding, data intake, validation, consolidation, inventory recovery, projectisation, deterministic Copilot, and workspaces exist in code.
- Phase 0.5 Integration Hub setup UI, data-source RPCs, Import API route, Import API credential/control-plane, external-record storage, sync jobs/errors, normalization handoff, provider MVP promotion, Shopify MVP worker, provider credential onboarding, WooCommerce MVP worker, scheduled sync worker, and M0-UI shared frontend foundation exist in `main`.
- Current branch `phase-0-5-canonical-approval-flows` adds explicit approval RPCs for normalized product, store, and sales review records.
- Shopify and WooCommerce credential checks read only approved server-side secret material through ignored env/secret management. They do not collect, display, store, or log provider secrets in browser-readable UI.
- Google Sheets worker, OAuth/provider credential entry UI, and automatic intelligence recalculation from normalized uploads are not complete.

Verification Status:
- Vercel production deployment `dpl_GfAHEeA1fDPgbZrNwYv6mat9LsvZ` is READY and aliased to `https://retailos-ten.vercel.app`.
- Production `/login` and `/signup` return 200.
- Production `/workspace` redirects unauthenticated users to `/login`.
- Production `/api/cron/integration-sync` returns 401 without the cron secret.
- Fresh Import API production smoke passed on July 16, 2026 after correcting Production `DATABASE_URL` and redeploying.
- Post-smoke runtime log inspection for the current production deployment found no error/fatal logs in the inspected window.
- Vercel Node runtime setting is aligned to `22.x`.
- M0-UI PR #33 was merged with green Quality, Security, and Vercel checks.
- Canonical approval focused typecheck and integration tests passed during implementation; full validation must pass before handoff.
- GitHub `main` branch is currently unprotected; secret scanning and push protection are enabled; Dependabot security updates are disabled.

Database Migration Status:
- Repository contains 12 Supabase migrations from secure foundation through Phase 0.5 provider MVP promotion.
- Scheduled sync migration `20260716214000_phase0_5_scheduled_sync.sql` was applied to hosted Supabase on July 16, 2026.
- Current branch adds migration `20260716223000_phase0_5_canonical_approval_flows.sql`.
- Hosted schema/RLS verification passed during M0-R.
- Supabase CLI is not installed in this shell, so `supabase migration list`, `supabase db reset`, and CLI migration-history reconciliation remain unverified.
- No destructive production database operation is authorized or performed.

Known Runtime Issues:
- Earlier production Import API failures were caused by invalid Production `DATABASE_URL` values: DNS lookup failures and password authentication failure for user `postgres`.
- The July 16, 2026 failure on deployment `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZL` had correlation ID `f9424e58-9bad-4b9e-8300-db956923fafa`.
- Resolution: Production `DATABASE_URL` was replaced from ignored local secret management, production was redeployed as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`, and fresh Import API smoke passed.

Current Mode:
- Implement canonical write approval flows for Phase 0.5 product, store, and sales review records.
- Do not ask users to paste secrets into chat or browser forms.
- Do not store provider access tokens in `data_sources.connection_metadata`, client code, fixtures, screenshots, docs, or Git.
- Do not add OAuth flows, Google Sheets worker, automatic intelligence recalculation, future phases, POS, finance, wholesale, warehouse management, forecasting, marketplace publishing, autonomous campaign execution, or real LLM agent execution in this slice.

Next Required Milestone:
- Review and accept the Canonical Write Approval Flows PR before continuing to automatic intelligence recalculation.
