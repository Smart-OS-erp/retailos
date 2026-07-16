# M0.9 — RetailOS UI Foundation

## Purpose

M0.9 establishes the shared RetailOS frontend foundation before broad Phase 0 feature expansion. It is a Phase 0 milestone for visual-system readiness, component architecture, formatting utilities, shell/navigation primitives, and testable UI states.

This milestone is not a product-requirements milestone. It must not finalize module structure, workflow language, statuses, roles, supplier terms, warehouse terms, finance terms, dashboard metrics, demo businesses, or retail-domain assumptions that still require consultant validation and product discovery.

## Implementation boundary

Allowed in M0.9:

- design tokens;
- shadcn/ui foundation;
- shared application shell;
- responsive navigation and topbar primitives;
- organization switcher;
- user menu;
- global search shell;
- central navigation configuration;
- central dashboard configuration;
- tenant defaults;
- tenant-aware market configuration;
- currency, locale, date, and timezone formatting utilities;
- reusable KPI cards;
- chart cards;
- activity feed primitives;
- stock-location components;
- RetailDataGrid;
- central status presentation;
- loading states;
- empty states;
- error states;
- forbidden states;
- stale states;
- success states;
- accessibility baseline;
- responsive behavior;
- documentation;
- tests.

Not allowed in M0.9:

- broad product UI screens presented as complete workflows;
- static dashboards presented as final product behavior;
- final navigation taxonomy;
- final module grouping;
- final dashboard KPIs or card arrangement;
- final workflow/status/role terminology;
- final purchase-order, finance, EDI, supplier, or warehouse product requirements;
- future-phase implementation;
- Ant Design;
- one-off tables that bypass RetailDataGrid without an approved exception;
- manual currency-symbol concatenation in UI modules.

## Stable decisions

- shadcn/ui is the approved visual foundation.
- Ant Design is prohibited.
- shared design tokens are required.
- shared application shell is required.
- shared RetailDataGrid is required.
- shared status mapping is required.
- shared currency, locale, date, and timezone formatting is required.
- tenant-aware market configuration is required.
- African-market demo defaults must use Nigeria, `en-NG`, `NGN`, and Africa-Lagos, implemented with the `Africa/Lagos` timezone identifier, unless tenant settings override them.
- UI modules must not manually concatenate currency symbols.
- new pages must use the shared shell.
- new tables must use RetailDataGrid unless an approved exception exists.

## Provisional decisions

The following are provisional placeholders in M0.9:

- navigation labels;
- navigation groups;
- module ordering;
- dashboard KPIs;
- dashboard card order;
- chart selection;
- purchase-order placeholder content;
- finance navigation;
- EDI placement;
- user roles shown in demo UI;
- statuses;
- workflows;
- supplier terminology;
- warehouse terminology;
- demo businesses;
- demo values;
- demo locations;
- demo suppliers;
- demo records.

The navigation structure, dashboard KPIs, card arrangement, module grouping, terminology, statuses, workflows, roles, locations, suppliers, and demo records introduced during the UI foundation milestone are provisional placeholders. They validate the design system and technical component architecture only. They are not final product requirements and must remain replaceable following retail-consultant validation and product-discovery decisions.

## Visual reference handling

The July 16, 2026 RetailOS visual reference may guide premium SaaS feel, density, contrast, sidebar/topbar rhythm, card styling, mobile responsiveness, and component coverage. It must not be treated as final product scope or final retail-domain truth.

Examples from the reference that remain provisional include purchasing, finance, warehouse, EDI, supplier names, sample currency values, sample KPIs, stock records, locations, role labels, and dashboard layout.

## Acceptance evidence required after implementation

An M0.9 implementation PR must provide evidence that:

- shadcn/ui is used and Ant Design is absent;
- tokens and shared primitives are implemented;
- app shell, navigation, topbar, organization switcher, user menu, and global search shell exist;
- navigation/dashboard/status definitions are centralized and provisional where product-specific;
- Nigeria/en-NG/NGN/Africa-Lagos defaults exist, use the `Africa/Lagos` timezone identifier, and are overrideable by tenant settings;
- currency/date/timezone formatting flows through shared utilities;
- RetailDataGrid is the default table system;
- loading, empty, error, forbidden, stale, success, and responsive states are testable;
- accessibility baseline is validated;
- no placeholder KPI, workflow, status, role, supplier, location, module, or demo record is represented as final product truth.

## Next implementation shape

The first M0.9 implementation PR should be a narrow foundation PR:

1. install/configure shadcn/ui and tokens;
2. add shared formatting and tenant-market defaults;
3. add shell/navigation/status/config primitives;
4. add RetailDataGrid and state primitives;
5. add tests proving required reuse and prohibitions;
6. document provisional placeholder boundaries.

Do not expand into finished feature screens until the foundation is accepted.
