# RetailOS

RetailOS is secure operating intelligence for African fashion retail. The active build is **Phase 1 - Core Inventory Operating System**, with the current branch recording **Phase 1 Visible Workflow Verification and Acceptance** before promotion to Phase 2.

RetailOS is not a generic ERP, POS, dashboard, or chatbot. Its first wedge was inventory recovery intelligence: trustworthy retail data intake, validation, consolidation, inventory risk explanation, recovery opportunities, projectisation, campaign briefs, and permission-aware Copilot explanations.

## Implemented in `main`

- Next.js 16 App Router with strict TypeScript and security headers.
- Supabase SSR clients for browser, server, and proxy boundaries.
- Email/password auth, signup, login, confirmation, logout, and server-side user verification.
- Organization creation, onboarding, company/location/brand/team/data-source setup, and role-aware protected routes.
- Organizations, memberships, RBAC, audit events, tenant-scoped tables, forced RLS, and deny-by-default grants.
- Phase 0 data intake, staging, validation, consolidation, Operating View, inventory recovery, projectisation, task, campaign brief, workspace, and deterministic Retail Copilot routes.
- Phase 0.5 Integration Hub setup UI and data-source RPCs.
- RetailOS Import API route at `/api/import/v1/records` with bearer-token hashing, idempotency, tenant scope, and raw external-record persistence.
- External-record normalization handoff for `inventory_snapshot`, `product_master`, `store_master`, and `sales_history`.
- Shopify and WooCommerce Phase 0.5 MVP workers, scheduled sync, canonical approval flows, and automatic intelligence recalculation evidence.
- M0-UI shared frontend foundation.
- Phase 1 inventory core foundation tables/RPCs for movement ledger, stock adjustments, transfers, stock counts, reconciliation issues, inventory search, watchlist signals, stock-count closure, and inventory lookup/search UI.

## Implemented on this branch

- User-saved inventory watchlist add/update/remove workflow layered on the existing persisted-evidence watchlist.
- RLS-protected `inventory_watchlist_items` table and `inventory_saved_watchlist` view.
- Permissioned `add_inventory_watchlist_item` and `remove_inventory_watchlist_item` RPCs with audit events.
- Live hosted Phase 1 workflow smoke covering search, watchlist, adjustments, transfers, stock counts, RBAC/location denials, audit events, and synthetic cleanup.
- Phase 1 acceptance matrix and evidence reports.

## Deployed

Production alias: `https://retailos-ten.vercel.app`

Current production commit before this acceptance branch:

- Commit: `478db13070f5504ef5291374556a1751c7591280`
- Source: merged `main`, after Phase 1 M1.9 PR #43

This acceptance branch still requires PR merge, Vercel deployment confirmation, and production route smoke.

## Verified

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test:integration -- --run tests/integration/phase1-inventory-core.test.ts` passed: 6 files, 49 tests.
- Hosted migration `20260718210000_phase1_visible_workflow_acceptance.sql` was applied or reconciled without printing secrets.
- `node scripts/security/live-phase1-hosted-schema.ts` passed: 15 relations/views, 16 functions.
- `node scripts/security/live-phase1-workflow-smoke.ts` passed and synthetic cleanup passed.

## Not Verified

- Supabase CLI migration history was not inspected because the `supabase` CLI is not installed/authenticated in this shell.
- A local `supabase db reset` was not run because the CLI is unavailable.
- This acceptance branch has not yet been merged/deployed to production.
- Browser route smoke for this acceptance branch must run after Vercel deployment.
- Live Shopify/WooCommerce provider API sync has not been run with real provider credentials.
- Google Sheets worker is not implemented.

## Blocked / Owner Actions

- Install/authenticate Supabase CLI and run migration-history reconciliation commands documented in `docs/SUPABASE_SETUP.md`.
- Configure GitHub branch protection for `main`; it is currently unprotected.
- Enable Dependabot security updates; secret scanning and push protection are enabled.
- Decide repository visibility: keep public or convert to private. Public visibility is not a security control; it does affect commercial/IP exposure.
- Merge/deploy this acceptance branch and run production route smoke before marking Phase 1 fully accepted.

## Local setup

1. Use Node 22.
2. Run `npm ci`.
3. Create ignored `.env.local` from `.env.example`.
4. Keep real values local or in managed deployment settings; never commit or paste them into chat, logs, screenshots, or fixtures.
5. Apply reviewed migrations to a non-production Supabase environment before exercising hosted workflows.
6. Run `npm run dev`.

Required variable names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
IMPORT_API_TOKEN_HASH_SECRET
SHOPIFY_CONNECTOR_CREDENTIALS_JSON
WOOCOMMERCE_CONNECTOR_CREDENTIALS_JSON
CRON_SECRET
```

Only `NEXT_PUBLIC_*` variables may be used by browser code. `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `IMPORT_API_TOKEN_HASH_SECRET`, provider credential variables, and `CRON_SECRET` are server-only.

## Validation

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run test:unit
npm run test:integration
npm run test:security
npm run security
npm run build
npm audit --audit-level=moderate
```

Environment-dependent checks:

```bash
npm run test:live-phase0-schema
npm run test:live-supabase
npm run smoke:import-api -- --url https://retailos-ten.vercel.app
node scripts/security/live-phase1-hosted-schema.ts
node scripts/security/live-phase1-workflow-smoke.ts
```

Read `AGENTS.md`, `reports/CURRENT_STATE.md`, and `reports/NEXT_TASK.md` before making changes.
