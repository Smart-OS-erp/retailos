Project: RetailOS
Active Phase: Phase 1 - Core Inventory Operating System
Active Milestone: Phase 1 - Inventory Operations Core M6

Current Production Commit: 75ae416
Current Production Deployment: dpl_J9F8LLaVC6AnEsa2bPZQFy86Gfqi
Production URL: https://retailos-ten.vercel.app

Implementation Status:
- Phase 0 foundation routes, onboarding, data intake, validation, consolidation, inventory recovery, projectisation, deterministic Copilot, and workspaces exist in code.
- Phase 0.5 Integration Hub setup UI, data-source RPCs, Import API route, Import API credential/control-plane, external-record storage, sync jobs/errors, normalization handoff, provider MVP promotion, Shopify MVP worker, provider credential onboarding, WooCommerce MVP worker, scheduled sync worker, canonical write approval flows, automatic intelligence recalculation evidence, and M0-UI shared frontend foundation exist in `main`.
- Human approval to promote to Phase 1 was given in chat before Phase 1 work began.
- Phase 1 Inventory Core Foundations M1-M5 were merged in PR #39 and deployed to production. The backend-only foundations include the inventory movement ledger, stock adjustments, transfer approvals, stock counts/variance, and inventory search/barcode lookup.
- Phase 1 Inventory Operations Core M6 is implemented locally on branch `phase-1-inventory-operations-core`. It adds current inventory balances, adjustment execution/reversal, transfer dispatch/partial/full receipt, transfer discrepancy evidence, idempotency controls, and shared-shell inventory operations pages.
- Shopify and WooCommerce credential checks read only approved server-side secret material through ignored env/secret management. They do not collect, display, store, or log provider secrets in browser-readable UI.
- Google Sheets worker and OAuth/provider credential entry UI remain deferred Phase 0.5 follow-ups.

Verification Status:
- Vercel production deployment `dpl_J9F8LLaVC6AnEsa2bPZQFy86Gfqi` is READY and aliased to `https://retailos-ten.vercel.app`.
- Production `/login` and `/signup` returned 200 on July 18, 2026.
- Production `/workspace` redirects unauthenticated users to `/login`.
- Production `/api/cron/integration-sync` returned 401 without the cron secret on July 18, 2026.
- Fresh Import API production smoke passed on July 16, 2026 after correcting Production `DATABASE_URL` and redeploying.
- Runtime error log inspection for deployment `dpl_J9F8LLaVC6AnEsa2bPZQFy86Gfqi` found no error logs in the inspected 10-minute window.
- Vercel Node runtime setting is aligned to `22.x`.
- M0-UI PR #33 was merged with green Quality, Security, and Vercel checks.
- Canonical approval PR #37 was merged.
- Automatic intelligence recalculation PR #38 was merged with green Quality, Security, and Vercel checks.
- Phase 1 inventory core foundation local validation passed: lint, typecheck, test, security, and build.
- Phase 1 M6 local validation passed on this branch: lint, typecheck, test, security, build, and dependency audit.
- Phase 1 M6 Vercel preview deployment is READY and protected; unauthenticated `/inventory` returned Vercel SSO 302 before app auth/schema access.
- GitHub `main` branch is currently unprotected; secret scanning and push protection are enabled; Dependabot security updates are disabled.

Database Migration Status:
- Repository contains Supabase migrations from secure foundation through Phase 1 M6.
- Scheduled sync migration `20260716214000_phase0_5_scheduled_sync.sql` was applied to hosted Supabase on July 16, 2026.
- Canonical approval migration `20260716223000_phase0_5_canonical_approval_flows.sql` was applied to hosted Supabase on July 16, 2026.
- Automatic intelligence recalculation migration `20260716233000_phase0_5_auto_intelligence_recalculation.sql` was applied to hosted Supabase on July 18, 2026.
- Phase 1 foundation migration `20260718093000_phase1_inventory_core_foundations.sql` was applied to hosted Supabase on July 18, 2026.
- Phase 1 M6 migration `20260718103000_phase1_inventory_operations_core.sql` exists locally but is not yet applied to hosted Supabase.
- Hosted schema/RLS verification passed during M0-R.
- Supabase CLI is not installed in this shell, so `supabase migration list`, `supabase db reset`, and CLI migration-history reconciliation remain unverified.
- No destructive production database operation is authorized or performed.

Known Runtime Issues:
- Earlier production Import API failures were caused by invalid Production `DATABASE_URL` values: DNS lookup failures and password authentication failure for user `postgres`.
- The July 16, 2026 failure on deployment `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZL` had correlation ID `f9424e58-9bad-4b9e-8300-db956923fafa`.
- Resolution: Production `DATABASE_URL` was replaced from ignored local secret management, production was redeployed as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`, and fresh Import API smoke passed.

Current Mode:
- Phase 1 Inventory Operations Core M6 is implemented and verified locally but not yet merged, hosted-migrated, or deployed.
- Do not ask users to paste secrets into chat or browser forms.
- Do not store provider access tokens in `data_sources.connection_metadata`, client code, fixtures, screenshots, docs, or Git.
- Do not add broad dashboards, POS, finance, wholesale, warehouse-management expansion beyond Phase 1 inventory-control workflows, forecasting, marketplace publishing, autonomous campaign execution, or real LLM agent execution in this slice.

Next Required Milestone:
- Finish M6 validation, open review PR, apply hosted migration after review, deploy preview/production only after PR acceptance, then proceed to stock-count review/closure and low/overstock watchlist.
