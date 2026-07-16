Next Task:
Complete, review, and merge M0-UI — RetailOS UI Foundation Implementation.

Required before acceptance:

- shadcn/ui-compatible foundation is configured and Ant Design remains absent.
- shared design tokens are available through `src/app/globals.css` and foundation primitives.
- shared application shell includes desktop sidebar, mobile navigation, topbar, organization switcher shell, user menu shell, global search shell, skip link, and main landmark.
- navigation configuration is centralized and marked provisional.
- dashboard/card configuration is centralized and marked provisional; it must not be presented as final product requirements.
- tenant market defaults provide Nigeria, `en-NG`, `NGN`, and `Africa/Lagos`, with an override path.
- currency/date/timezone formatting flows through shared utilities.
- shared status presentation provides labels, tones, and non-color assistive labels.
- RetailDataGrid exists and is used for the representative Integration Hub data-source table.
- reusable KPI card, chart card, activity feed, stock-location, loading, empty, error, forbidden, stale, and success primitives exist.
- tests cover M0-UI defaults, provisional config, status mapping, Ant Design absence, no manual currency symbol concatenation in UI modules, and representative RetailDataGrid reuse.
- lint, typecheck, test, security, and build pass.

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
