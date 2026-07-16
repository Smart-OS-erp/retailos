# RetailOS

RetailOS is secure operating intelligence for African fashion retail. The active build is **Phase 0.5 — Integration Hub MVP**, with the current milestone **M0-R — Harness Reconciliation and Production Hardening**.

RetailOS is not a generic ERP, POS, dashboard, or chatbot. Its first wedge is inventory recovery intelligence: trustworthy retail data intake, validation, consolidation, inventory risk explanation, recovery opportunities, projectisation, campaign briefs, and permission-aware Copilot explanations.

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
- Shopify Phase 0.5 MVP worker code that is server-only, credential-gated, writes Shopify product/inventory payloads to `external_records`, and hands off to normalization.

## Deployed

Production alias: `https://retailos-ten.vercel.app`

Current inspected production deployment:

- Deployment: `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`
- Commit: `d19a4635d32bfc5b0d26916e3efbd8603e751372`
- Source: merged `main`, PR #31
- Runtime: Node 22 via `package.json` and Vercel project setting

## Verified

- Local lint, typecheck, unit, integration, security, and build checks pass on recent Phase 0.5 milestones.
- Production `/login` and `/signup` return 200.
- Production `/workspace` redirects unauthenticated users to `/login`.
- Fresh production Import API smoke passed on July 16, 2026 after replacing the Production `DATABASE_URL` with the approved Supabase pooler value and redeploying.
- Post-smoke production runtime error check for `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE` found no error/fatal logs in the inspected window.
- Vercel Git integration points to `Smart-OS-erp/retailos`, production branch `main`.
- Vercel project Node setting is aligned to `22.x`.

## Not Verified

- Supabase CLI migration history was not inspected in M0-R because the `supabase` CLI is not installed in this shell.
- A local `supabase db reset` was not run because the CLI is unavailable.
- Live Shopify provider API sync has not been run with real Shopify credentials.
- WooCommerce and Google Sheets workers are not implemented.
- Product/location/sales canonical write approval flows are not implemented.
- Automatic intelligence recalculation after normalized external records is not implemented.

## Blocked / Owner Actions

- Install/authenticate Supabase CLI and run migration-history reconciliation commands documented in `docs/SUPABASE_SETUP.md`.
- Decide repository visibility: keep public or convert to private. Public visibility is not a security control; it does affect commercial/IP exposure.
- Configure GitHub branch protection for `main`; it is currently unprotected.
- Enable Dependabot security updates; secret scanning and push protection are enabled.
- Provide reviewed server-only provider credentials before any live Shopify/WooCommerce/Google Sheets sync is accepted.

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
```

Only `NEXT_PUBLIC_*` variables may be used by browser code. `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `IMPORT_API_TOKEN_HASH_SECRET`, and provider credential variables are server-only.

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
```

Read `AGENTS.md`, `reports/CURRENT_STATE.md`, and `reports/NEXT_TASK.md` before making changes.
