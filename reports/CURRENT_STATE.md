Project: RetailOS
Active Phase: Phase 0.5 — Integration Hub MVP
Active Milestone: Phase 0.5 — Scheduled Sync Worker

Current Production Commit: d19a4635d32bfc5b0d26916e3efbd8603e751372
Current Production Deployment: dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE
Production URL: https://retailos-ten.vercel.app

Implementation Status:
- Phase 0 foundation routes, onboarding, data intake, validation, consolidation, inventory recovery, projectisation, deterministic Copilot, and workspaces exist in code.
- Phase 0.5 Integration Hub setup UI, data-source RPCs, Import API route, Import API credential/control-plane, external-record storage, sync jobs/errors, normalization handoff, provider MVP promotion, Shopify MVP worker, provider credential onboarding, WooCommerce MVP worker, and M0-UI shared frontend foundation exist in `main`.
- Current branch `phase-0-5-scheduled-sync` adds tenant-scoped scheduled-sync metadata, a protected Vercel Cron route, and a scheduled executor for accepted Shopify/WooCommerce MVP workers.
- Shopify and WooCommerce credential checks read only approved server-side secret material through ignored env/secret management. They do not collect, display, store, or log provider secrets in browser-readable UI.
- Google Sheets worker, OAuth/provider credential entry UI, product/location/sales canonical write approval flows, and automatic intelligence recalculation from normalized uploads are not complete.

Verification Status:
- Vercel production deployment `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE` is READY and aliased to `https://retailos-ten.vercel.app`.
- Production `/login` and `/signup` return 200.
- Production `/workspace` redirects unauthenticated users to `/login`.
- Fresh Import API production smoke passed on July 16, 2026 after correcting Production `DATABASE_URL` and redeploying.
- Post-smoke runtime log inspection for the current production deployment found no error/fatal logs in the inspected window.
- Vercel Node runtime setting is aligned to `22.x`.
- M0-UI PR #33 was merged with green Quality, Security, and Vercel checks.
- Scheduled sync focused typecheck and unit/integration tests passed during implementation; full validation must pass before handoff.
- GitHub `main` branch is currently unprotected; secret scanning and push protection are enabled; Dependabot security updates are disabled.

Database Migration Status:
- Repository contains 12 Supabase migrations from secure foundation through Phase 0.5 provider MVP promotion.
- Scheduled sync adds migration `20260716214000_phase0_5_scheduled_sync.sql` for tenant-scoped `data_source_sync_schedules`.
- Hosted schema/RLS verification passed during M0-R.
- Supabase CLI is not installed in this shell, so `supabase migration list`, `supabase db reset`, and CLI migration-history reconciliation remain unverified.
- No destructive production database operation is authorized or performed.

Known Runtime Issues:
- Earlier production Import API failures were caused by invalid Production `DATABASE_URL` values: DNS lookup failures and password authentication failure for user `postgres`.
- The July 16, 2026 failure on deployment `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZL` had correlation ID `f9424e58-9bad-4b9e-8300-db956923fafa`.
- Resolution: Production `DATABASE_URL` was replaced from ignored local secret management, production was redeployed as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`, and fresh Import API smoke passed.

Current Mode:
- Implement the scheduled sync worker for Phase 0.5.
- Do not ask users to paste secrets into chat or browser forms.
- Do not store provider access tokens in `data_sources.connection_metadata`, client code, fixtures, screenshots, docs, or Git.
- Do not add OAuth flows, Google Sheets worker, future phases, POS, finance, wholesale, warehouse management, forecasting, marketplace publishing, autonomous campaign execution, or real LLM agent execution in this slice.

Next Required Milestone:
- Review and accept the Scheduled Sync Worker PR before continuing to canonical product/location/sales approval flows.
