Next Task:
Complete and merge M0-R — Harness Reconciliation and Production Hardening.

Required before acceptance:

- AGENTS.md renders correctly and has the operational start section.
- README and source-of-truth reports match actual `main` and production state.
- Production deployment, commit, environment names, and runtime evidence are recorded.
- Import API production database failures are resolved and recorded.
- Fresh production Import API smoke passes using synthetic data and cleanup.
- Production runtime logs show no new relevant Import API 5xx after the smoke.
- Vercel Node runtime setting is aligned with `package.json`.
- Supabase migration history is reconciled if CLI access is available; otherwise exact owner action remains open.
- GitHub stale merged branches are reconciled where safe.
- Branch protection and repository visibility decisions are documented.
- `reports/RELEASE_CHECKPOINT.md` is created.
- Full validation suite is run or environment-dependent blockers are documented honestly.

Next Approved Milestone After M0-R:
M0-UI — RetailOS UI Foundation Implementation.

M0-UI may implement:

- design tokens;
- shadcn/ui foundation;
- shared application shell;
- responsive navigation/topbar primitives;
- organization switcher;
- user menu;
- global search shell;
- central navigation and dashboard configuration;
- tenant market defaults;
- shared currency/date/timezone formatting;
- reusable KPI/chart/activity/status/loading/empty/error primitives;
- stock-location primitives;
- RetailDataGrid;
- accessibility baseline;
- responsive behavior;
- documentation and tests.

M0-UI must not finalize retail-domain requirements that still require consultant validation and product discovery. Navigation labels, groups, KPIs, card order, chart choice, suppliers, warehouses, statuses, roles, EDI placement, finance navigation, report categories, demo businesses, demo values, and business terminology remain provisional and replaceable.

Do not start Phase 1. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
