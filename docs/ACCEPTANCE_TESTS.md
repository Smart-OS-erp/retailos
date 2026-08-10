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
- Pre-M2.12 blocker: Supabase CLI `2.113.0` is installed, but the current CLI account cannot access project `djvqhjgkcljdiuicdtpx`, and local `supabase db reset` cannot run because Docker/Podman is unavailable on PATH.
- M0-UI local evidence: `tests/unit/ui-foundation.test.ts` verifies Nigeria/`en-NG`/`NGN`/`Africa/Lagos` defaults, tenant market overrides, shared Intl formatting, provisional navigation/dashboard configuration, non-color status presentation, shadcn/ui configuration, Ant Design absence, no manual currency-symbol concatenation in UI modules, and representative `RetailDataGrid` reuse.
- Phase 0.5 provider credential onboarding evidence: `tests/unit/provider-credential-verification.test.ts` covers configured, missing, unsupported-provider, and non-MVP Shopify credential availability outcomes. It also covers WooCommerce configured credential availability through the server-only resolver boundary. `tests/unit/integration-hub-ui.test.ts` verifies the browser-facing Integration Hub exposes only safe credential actions/messages and no provider secret values.
- Phase 0.5 WooCommerce worker evidence: `tests/unit/woocommerce-worker.test.ts` covers fail-closed missing credentials, raw record persistence before normalization, provider-sync handoff into `normalize_external_records(sync_job_id)`, and WooCommerce product-to-`product_master`/`inventory_snapshot` mapping.
- Phase 0.5 scheduled sync evidence: `tests/unit/scheduled-sync.test.ts` covers deterministic scheduled idempotency keys, due-schedule claiming, scheduled enqueue behavior, normalization handoff, idempotency reuse, and fail-closed unsupported providers. `tests/unit/scheduled-sync-route.test.ts` covers `CRON_SECRET` authorization and missing-secret fail-closed behavior. `tests/integration/phase0-5-integration-hub.test.ts` covers tenant-scoped scheduled-sync metadata and audit evidence.
- Phase 0.5 canonical approval evidence: `tests/integration/phase0-5-integration-hub.test.ts` covers explicit approval of normalized product master, store master, and sales history review rows into canonical products/SKUs, locations, and sales facts, including product approval idempotency.
- Phase 0.5 automatic intelligence recalculation evidence: `tests/integration/phase0-consolidation-hub.test.ts` verifies approved inventory consolidation records a tenant-scoped `intelligence_recalculation_runs` row and creates a deterministic `intelligence_runs` record for the approved snapshot. `tests/integration/phase0-5-integration-hub.test.ts` verifies product, store, and sales approval flows record skipped recalculation evidence with `canonical_record_type_not_inventory_scored` instead of pretending standalone canonical writes changed inventory-risk scores.
- Phase 1 inventory operations evidence: `tests/integration/phase1-inventory-core.test.ts` verifies stock adjustment approval does not mutate balances until execution, executed adjustments are idempotent, reversal writes compensating movement rows, transfer approval reserves stock without ledger mutation, dispatch writes outbound movement rows, partial receipt creates visible discrepancy evidence, final receipt reconciles discrepancy state, stock counts create variance reconciliation issues, stock-count review/closure can post idempotent correction movements, watchlist signals derive from persisted balances, saved watchlist add/remove is permissioned and audited, inventory search works by SKU/barcode within effective location scope, and cross-tenant/under-privileged inventory operations are denied.
- Phase 1 visible workflow acceptance evidence: `reports/PHASE_1_ACCEPTANCE_MATRIX.md` and `reports/PHASE_1_ACCEPTANCE_EVIDENCE.md` record conditional Phase 1 acceptance. `node scripts/security/live-phase1-hosted-schema.ts` verifies 15 hosted relations/views and 16 functions. `node scripts/security/live-phase1-workflow-smoke.ts` creates a synthetic tenant, exercises inventory search, saved watchlist add/remove, adjustment execute/reverse, transfer partial/full receipt, stock-count close/correction, role/location denial, audit events, and cleanup.
- Phase 2 M2.0-M2.6 evidence: `tests/integration/phase2-merchandising-planning.test.ts` verifies merchandising visibility, store-manager denial, recommendation generation, markdown draft conversion, planning cycle creation/approval, assortment item upsert, and audit evidence. `node scripts/security/live-phase2-hosted-schema.ts` verifies hosted Phase 2 relations/views/functions. `reports/PHASE_2_ACCEPTANCE_MATRIX.md` and `reports/PHASE_2_ACCEPTANCE_EVIDENCE.md` record the M2.0-M2.6 status.

## Phase 1 inventory operations acceptance

Phase 1 M6-M1.9 acceptance requires:

- current inventory positions are derived from approved snapshots plus persisted movement ledger rows;
- approval, execution, reversal, dispatch, receipt, and discrepancy transitions are represented by database functions, not client-only state;
- duplicate execute/reverse/dispatch/receipt submissions with the same idempotency key do not double-post stock movements;
- transfer approval, dispatch, partial receipt, full receipt, and discrepancy reconciliation are auditable;
- stock-count review, closure, issue decisions, and optional correction posting are auditable and idempotent;
- low-stock, out-of-stock, overstock, and in-transit watchlist signals are derived from persisted balances and clearly not represented as forecasts;
- SKU/barcode lookup works through location-scoped database permissions;
- Phase 1 pages use the shared AppShell, RetailDataGrid, shared status mapping, and shared market formatting;
- UI queries and actions are tenant scoped by active organization and rely on RBAC/RLS-protected records;
- no POS, finance, procurement, forecasting, wholesale, or broad dashboard behavior is introduced.

Phase 1 cannot be accepted merely because routes, migrations, tests, and deployments exist. Acceptance must show that representative users can safely complete visible workflows backed by persisted tenant data, that duplicate submissions do not double-post stock movements, that denied roles fail closed, that audit events are written, that synthetic live data is cleaned up, and that remaining release/migration blockers are recorded honestly.

## Phase 2 M2.0-M2.6 merchandising acceptance

Phase 2 M2.0-M2.6 acceptance requires:

- merchandising permissions are enforced in UI, database policies, and RPCs;
- product productivity metrics use persisted inventory, sales, and risk evidence;
- sell-through is labeled as a historical proxy, not a forecast;
- brand/category/collection performance remains explicit about unassigned collections;
- markdown drafts do not execute prices, promotions, campaigns, POS, or ecommerce changes;
- planning-cycle approvals do not execute buying, supplier, transfer, warehouse, or finance workflows;
- recommendation generation displays confidence and can return `insufficient_data`;
- store managers and under-privileged roles fail closed;
- audit events exist for sensitive planning actions;
- no POS, payments, finance/accounting, wholesale, advanced forecasting, autonomous Copilot execution, or Phase 3 store-operations scope is introduced.

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

## Phase 0 final milestones

M0.20 acceptance requires:

- RetailOS African Fashion Retail Operating Model v0.9 exists and clearly marks interim, configurable, consultant-review, and pilot-validation assumptions.
- Aso Collective synthetic dataset lineage is `ASO_PHASE0_DATASET_V1` → `ASO_INVENTORY_OPERATIONS_V2` → `ASO_MERCHANDISING_PILOT_V3`.
- The dataset includes one coherent retailer, 5 locations, 60 styles, 240 SKUs, 10 months of history, required messy-data scenarios, required retail scenarios, source-system fixtures, and machine-readable expected results.
- `npm run demo:seed`, `npm run demo:verify`, `npm run demo:reset`, and `npm run demo:cleanup` perform deterministic checks and fail non-zero on mismatch.
- No real retailer data, secrets, plaintext passwords, or production mutations are introduced.

M0.21 acceptance requires the complete Phase 0 journey from raw source data through validation, correction, identity resolution, canonical approval, consolidation, operating view, confidence, aging, risk, Attention Queue, recovery opportunity, projectisation, campaign brief, tasks, and deterministic Copilot explanation. It must create `reports/PHASE_0_ACCEPTANCE_MATRIX.md`, `reports/PHASE_0_ACCEPTANCE_EVIDENCE.md`, and `reports/PHASE_0_FINAL_DECISION.md`.
