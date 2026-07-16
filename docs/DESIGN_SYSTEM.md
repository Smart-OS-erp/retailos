# Design System

This file records constraints for Phase 0 product implementation. The approved design handoff lives in `plans/PHASE_0_UI_UX_HANDOFF.md`; implementation still proceeds only with each milestone's real data, authorization, states, and tests.

## Principles

- Clear before clever: users should see what a metric means, when it was calculated, and what they can do.
- Operational density with calm hierarchy: support real retail work without decorative dashboards.
- Mobile-first resilience: core review and approval paths must work on small screens and tolerate interrupted workflows.
- Accessible by default: WCAG 2.2 AA minimum target, semantic structure, keyboard operation, visible focus, sufficient contrast, and non-color status cues.
- Local context: currencies, dates, timezones, names, addresses, and terminology must be configurable and correctly formatted.
- Trust surfaces: provenance, freshness, confidence, permission state, destructive impact, and confirmation are first-class components.

## Token source

Machine-readable starter tokens live in `figma-handoff/design-tokens.json`. They are documentation values, not a shipped UI theme. Token changes require design and accessibility review.

## Approved UI foundation milestone

M0.9 — RetailOS UI Foundation is approved as the shared frontend-system milestone for Phase 0. It is allowed to establish the visual language and component architecture before broad Phase 0 feature expansion.

Stable M0.9 decisions:

- shadcn/ui is the approved visual foundation.
- Ant Design is prohibited.
- shared design tokens are required.
- a shared application shell is required.
- shared responsive navigation and topbar primitives are required.
- shared organization switcher, user menu, and global search shell are required.
- central navigation and dashboard configuration are required.
- shared RetailDataGrid is required for new tables unless an approved exception exists.
- shared status mapping is required.
- shared currency, date, locale, and timezone formatting utilities are required.
- tenant-aware market configuration is required.
- African-market demo defaults must use Nigeria, `en-NG`, `NGN`, and Africa-Lagos, implemented with the `Africa/Lagos` timezone identifier, unless tenant settings override them.
- UI modules must not manually concatenate currency symbols.
- new pages must use the shared shell.

Provisional M0.9 decisions:

- navigation labels, groups, and module ordering;
- dashboard KPIs, card order, chart selection, and configurable placeholder dashboard content;
- purchase-order placeholder content, finance navigation, and EDI placement;
- user roles shown in demo UI;
- statuses, workflows, supplier terminology, and warehouse terminology;
- demo businesses, locations, suppliers, values, and records.

The navigation structure, dashboard KPIs, card arrangement, module grouping, terminology, statuses, workflows, roles, locations, suppliers, and demo records introduced during the UI foundation milestone are provisional placeholders. They validate the design system and technical component architecture only. They are not final product requirements and must remain replaceable following retail-consultant validation and product-discovery decisions.

The provided RetailOS visual reference may guide premium SaaS feel, density, spacing, and mobile/desktop responsiveness. It must not be treated as final information architecture, final metrics, final roles, final suppliers, final finance/purchasing/warehouse scope, or final product requirements.

## Component expectations

Future components need documented states for loading, empty, partial, stale, error, offline/retry, forbidden, and success. Tables must remain understandable on mobile. Actions must distinguish proposal, approval, execution, and rollback state.

## M0-UI implementation notes

The M0-UI foundation implements shared primitives under `src/components/ui/` and shared UI configuration under `src/lib/ui/`.

The shell and configuration work is architectural: placeholder navigation, dashboard card slots, statuses, roles, and module ordering remain provisional unless a later product-discovery decision promotes them. New tables should use `RetailDataGrid` unless an exception is documented. Currency, date, locale, and timezone presentation should use `src/lib/ui/market.ts`; UI modules must not manually concatenate currency symbols.

## Prohibition

Do not generate static dashboards or screens to imply product progress. Build UI only when a phase-approved vertical slice has real authorization, data, states, and tests.
