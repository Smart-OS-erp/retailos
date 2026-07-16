# Open Blockers

## M0-R production/harness blockers

- **Supabase CLI migration-history reconciliation is not verified in this shell.** The `supabase` CLI is not installed, so `supabase migration list`, `supabase db reset`, and `supabase db push --dry-run` could not run. Owner/action: install and authenticate Supabase CLI, link the approved project, run the safe commands documented in `docs/SUPABASE_SETUP.md`, and record results before accepting migration-history reconciliation.
- **GitHub `main` branch is unprotected.** GitHub API returned `Branch not protected` for `main`. Owner/action: enable branch protection requiring PRs, CI quality, security checks, no force-push, and no deletion where practical.
- **Dependabot security updates are disabled.** GitHub repo security analysis reports secret scanning and push protection enabled, but Dependabot security updates disabled. Owner/action: enable Dependabot security updates or record founder-approved exception.
- **Repository visibility decision remains open.** The repository is public. Owner/action: founder must decide whether to keep it public or convert it to private; do not treat obscurity as a security control, but document commercial/IP implications.
- **Provider credential onboarding is not implemented.** Shopify worker exists but requires reviewed server-only credentials. WooCommerce and Google Sheets workers do not exist. Owner/action: implement provider credential management and one remaining provider worker at a time after M0-R.

## Phase 0.5 implementation blockers

- **WooCommerce and Google Sheets workers are not implemented.** Their data sources can be created as MVP-depth, but live provider API calls remain fail-closed until workers and credentials are implemented.
- **Scheduled sync workers are not implemented.** Manual sync exists; background scheduling remains future Phase 0.5 work.
- **Product/location/sales canonical write approval flows are not implemented.** External record normalization produces upload/raw/validation evidence, but product master, store master, and sales history do not directly mutate canonical products, locations, SKUs, or sales facts.
- **Automatic intelligence recalculation after normalized imports is not implemented.** Existing intelligence remains based on approved persisted/consolidated data paths.

## Verified controls

- Production `DATABASE_URL` was replaced as a sensitive Vercel Production variable on July 16, 2026.
- Production was redeployed as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`.
- Fresh Import API production smoke passed after redeploy.
- Production `/login` and `/signup` return 200.
- Production `/workspace` redirects unauthenticated users to `/login`.
- Post-smoke runtime error inspection found no error/fatal logs for the current production deployment in the inspected window.
- Vercel project Node setting is aligned to `22.x`.
- Stale merged remote branches visible locally were deleted.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain Phase 0 intelligence decisions.

M0-UI remains the next approved milestone but must keep navigation labels, dashboard KPIs, roles, statuses, supplier/warehouse/finance terminology, demo records, and business assumptions provisional until consultant validation.

Phase 0.5 does not authorize POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
