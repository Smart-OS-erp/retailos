# Open Blockers

## M0-R production/harness blockers

- **Supabase CLI migration-history reconciliation is not verified in this shell.** The `supabase` CLI is not installed, so `supabase migration list`, `supabase db reset`, and `supabase db push --dry-run` could not run. Owner/action: install and authenticate Supabase CLI, link the approved project, run the safe commands documented in `docs/SUPABASE_SETUP.md`, and record results before accepting migration-history reconciliation.
- **GitHub `main` branch is unprotected.** GitHub API returned `Branch not protected` for `main`. Owner/action: enable branch protection requiring PRs, CI quality, security checks, no force-push, and no deletion where practical.
- **Dependabot security updates are disabled.** GitHub repo security analysis reports secret scanning and push protection enabled, but Dependabot security updates disabled. Owner/action: enable Dependabot security updates or record founder-approved exception.
- **Repository visibility decision remains open.** The repository is public. Owner/action: founder must decide whether to keep it public or convert it to private; do not treat obscurity as a security control, but document commercial/IP implications.
- **Provider credential onboarding remains server-secret only.** Shopify and WooCommerce server-side availability checks exist. Browser secret entry, OAuth, and Google Sheets credentials do not exist. Owner/action: accept this narrow server-side provider credential model before adding any browser credential-entry flow.

## Phase 0.5 deferred implementation blockers

- **Google Sheets worker is not implemented.** Shopify and WooCommerce MVP workers exist. Google Sheets data sources can be created as MVP-depth, but live Google Sheets API calls remain fail-closed until a worker and credential resolver are implemented.

## Phase 1 acceptance blockers

- **Phase 1 acceptance branch production deployment is pending.** Phase 1 M1.9 is merged/deployed and hosted workflow smoke passes, but this acceptance hardening branch still needs PR merge, Vercel deployment verification, affected-route smoke, and runtime-log inspection. Owner/action: merge the accepted PR, smoke `/login`, `/inventory`, `/inventory/counts`, `/inventory/search`, and `/inventory/watchlist`, inspect runtime logs where tooling permits it, and record deployment evidence.
- **Supabase CLI migration-history reconciliation is still unverified.** Hosted SQL was applied/reconciled safely, but CLI migration history and local reset remain blocked until the Supabase CLI is installed/authenticated. Owner/action: install/authenticate Supabase CLI, link the approved project, and run the safe commands documented in `docs/SUPABASE_SETUP.md`.

## Verified controls

- Production `DATABASE_URL` was replaced as a sensitive Vercel Production variable on July 16, 2026.
- Production was redeployed as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`.
- Fresh Import API production smoke passed after redeploy.
- Production `/login` and `/signup` return 200.
- Production `/workspace` redirects unauthenticated users to `/login`.
- Post-smoke runtime error inspection found no error/fatal logs for the current production deployment in the inspected window.
- Vercel project Node setting is aligned to `22.x`.
- Stale merged remote branches visible locally were deleted.
- Phase 1 visible workflow hosted schema verification passed for 15 relations/views and 16 functions.
- Live Phase 1 synthetic workflow smoke passed and cleaned up its synthetic tenant/users.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain Phase 0 intelligence decisions.

M0-UI remains the next approved milestone but must keep navigation labels, dashboard KPIs, roles, statuses, supplier/warehouse/finance terminology, demo records, and business assumptions provisional until consultant validation.

Phase 1 does not authorize POS, finance, wholesale, forecasting, warehouse-management expansion beyond inventory-control foundations, marketplace publishing, autonomous campaign execution, or real LLM agent execution.

The founder/user has explicitly approved promotion into Phase 2 after Phase 1 acceptance is recorded, with implementation to proceed milestone-by-milestone and stop at M2.6.
