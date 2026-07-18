# Acceptance Tests

## Harness acceptance

- All requested repository paths exist.
- `reports/CURRENT_STATE.md` names Phase 0 and accurately records the current implementation mode.
- `AGENTS.md` contains mission, roadmap, active-phase control, Security Grade AAA+, harness standard, workflow, phase gates, prohibitions, validation, and handoff format.
- Future phases are documentation-only.
- Placeholder scripts execute safely and state their incomplete scope.
- CI exposes lint, typecheck, test, build, and security jobs/steps without claiming an absent application was validated.
- No secrets, service-role browser usage, static dashboard data, or fake product screens are present.

## Secure-foundation acceptance

- An unauthenticated user cannot access tenant data.
- A user without membership cannot access an organization by changing client input.
- Tenant A cannot select, insert, update, delete, or subscribe to Tenant B data.
- Roles produce the documented allow/deny outcomes in UI, API, and database tests.
- Service-role credentials are absent from client bundles and public environment variables.
- Organization creation/invitation is validated, idempotent where retried, and audited.
- RLS is enabled and policy coverage is verified for every tenant table.
- Security tests fail when a representative tenant filter, API guard, or RLS policy is removed.

## Current evidence

- Local lint, strict TypeScript, unit, integration, security, dependency audit, and production build are required for every production-affecting milestone.
- The embedded PostgreSQL integration suite creates two authenticated users and organizations, verifies own-tenant reads/updates, denies cross-tenant reads/updates, denies anonymous table access, denies direct membership writes, and verifies atomic onboarding/audit behavior.
- Source-boundary tests verify that server-only variable names are unreachable from browser modules and protected onboarding code reauthorizes on the server.
- The reviewed migration is applied to non-production `retailos-dev`; synthetic live Auth, onboarding, audit, RBAC, anonymous denial, and two-tenant RLS verification pass with cleanup.
- Confirm-email signups, an eight-character minimum password, and exact local confirmation callback URLs are configured.
- Vercel Git linkage, protected preview deployment, hosted setup/onboarding, hosted schema/RLS checks, and Supabase migration-history repair are verified for the protected non-production Phase 0 demo.
- Current hosted Supabase confirmation email behavior is explicitly accepted for the protected non-production Phase 0 demo. Token-hash template activation through custom SMTP/eligible plan support remains a production-governance follow-up if required before production launch.
- M0-R production smoke evidence: production Import API smoke passed against `https://retailos-ten.vercel.app` on deployment `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE` after correcting Production `DATABASE_URL`; `/login` and `/signup` returned 200; `/workspace` redirected unauthenticated users to `/login`; post-smoke runtime error/fatal logs were empty for the inspected deployment window.
- M0-R blocker: Supabase CLI migration-history verification and local `supabase db reset` were not run because the CLI is not installed in this shell.
- M0-UI local evidence: `tests/unit/ui-foundation.test.ts` verifies Nigeria/`en-NG`/`NGN`/`Africa/Lagos` defaults, tenant market overrides, shared Intl formatting, provisional navigation/dashboard configuration, non-color status presentation, shadcn/ui configuration, Ant Design absence, no manual currency-symbol concatenation in UI modules, and representative `RetailDataGrid` reuse.
- Phase 0.5 provider credential onboarding evidence: `tests/unit/provider-credential-verification.test.ts` covers configured, missing, unsupported-provider, and non-MVP Shopify credential availability outcomes. It also covers WooCommerce configured credential availability through the server-only resolver boundary. `tests/unit/integration-hub-ui.test.ts` verifies the browser-facing Integration Hub exposes only safe credential actions/messages and no provider secret values.
- Phase 0.5 WooCommerce worker evidence: `tests/unit/woocommerce-worker.test.ts` covers fail-closed missing credentials, raw record persistence before normalization, provider-sync handoff into `normalize_external_records(sync_job_id)`, and WooCommerce product-to-`product_master`/`inventory_snapshot` mapping.
- Phase 0.5 scheduled sync evidence: `tests/unit/scheduled-sync.test.ts` covers deterministic scheduled idempotency keys, due-schedule claiming, scheduled enqueue behavior, normalization handoff, idempotency reuse, and fail-closed unsupported providers. `tests/unit/scheduled-sync-route.test.ts` covers `CRON_SECRET` authorization and missing-secret fail-closed behavior. `tests/integration/phase0-5-integration-hub.test.ts` covers tenant-scoped scheduled-sync metadata and audit evidence.
- Phase 0.5 canonical approval evidence: `tests/integration/phase0-5-integration-hub.test.ts` covers explicit approval of normalized product master, store master, and sales history review rows into canonical products/SKUs, locations, and sales facts, including product approval idempotency.
- Phase 0.5 automatic intelligence recalculation evidence: `tests/integration/phase0-consolidation-hub.test.ts` verifies approved inventory consolidation records a tenant-scoped `intelligence_recalculation_runs` row and creates a deterministic `intelligence_runs` record for the approved snapshot. `tests/integration/phase0-5-integration-hub.test.ts` verifies product, store, and sales approval flows record skipped recalculation evidence with `canonical_record_type_not_inventory_scored` instead of pretending standalone canonical writes changed inventory-risk scores.

## M0.9 UI foundation acceptance

M0.9 acceptance applies to the M0-UI implementation PR. The implementation must remain foundation-only and must not turn provisional placeholder configuration into final product truth.

- shadcn/ui is installed/configured as the approved foundation and Ant Design is absent.
- shared design tokens are documented, testable, and wired into shared UI primitives.
- shared application shell, responsive navigation, topbar, organization switcher, user menu, and global search shell exist.
- navigation and dashboard definitions are centralized and clearly marked provisional.
- tenant market defaults include Nigeria, `en-NG`, `NGN`, and Africa-Lagos using the `Africa/Lagos` timezone identifier, with tenant-setting overrides where available.
- currency, locale, date, and timezone formatting flows through shared utilities; manual currency-symbol concatenation is rejected by review or tests.
- reusable KPI cards, chart cards, activity-feed primitives, stock-location primitives, RetailDataGrid, status presentation, loading states, empty states, error states, forbidden states, stale states, and success states exist.
- RetailDataGrid is used for new tables unless an approved exception is documented.
- accessibility baseline covers semantic structure, visible focus, keyboard operation, non-color status cues, and WCAG 2.2 AA contrast targets.
- responsive behavior is validated for desktop and mobile foundation layouts.
- placeholder navigation, KPIs, dashboard cards, chart selections, purchase-order content, finance navigation, EDI placement, roles, statuses, workflows, supplier terminology, warehouse terminology, demo businesses, demo values, and demo records are explicitly marked provisional and replaceable.
- no placeholder content is presented as final product truth or consultant-validated retail requirements.

## Evidence rules

Acceptance evidence must name the environment, commit, command or scenario, outcome, and retained artifact. Placeholder, skipped, or not-yet-applicable checks are reported honestly and cannot satisfy a later product gate.

Production-affecting milestones must also record:

- production commit SHA;
- Vercel deployment ID;
- runtime error check result;
- rollback target;
- migration-history status;
- whether smoke data was synthetic and cleaned up.

Historical success evidence does not override current runtime errors. A milestone cannot be accepted while a current production 5xx caused by that milestone remains unresolved.
