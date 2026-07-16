# Phase 0 Scope — Foundation: Inventory Recovery Intelligence

## Goal

Create a secure foundation for inventory recovery intelligence and, after the harness PR is accepted, deliver the smallest trustworthy path from tenant-scoped inventory facts to explainable recovery opportunities.

## Current delivery mode

Phase 0 product foundations exist in code and production. Phase 0.5 Integration Hub MVP is the active phase. The current milestone is M0-R — Harness Reconciliation and Production Hardening, which is documentation, verification, deployment-state, and harness hardening only.

M0-R does not authorize new product features, dashboards, UI Foundation implementation, new providers, Phase 1 work, or future-phase implementation.

## In scope

- Secure SaaS foundation expansion and full onboarding.
- M0.9 — RetailOS UI Foundation: shared frontend system architecture, visual language, design tokens, shadcn/ui foundation, shared application shell, responsive navigation/topbar primitives, organization switcher, user menu, global search shell, central navigation/dashboard configuration, tenant-aware market defaults, shared currency/locale/date/timezone formatting utilities, reusable KPI/chart/activity/status/loading/empty/error primitives, stock-location primitives, RetailDataGrid, accessibility baseline, responsive behavior, documentation, and tests.
- Tenant-scoped sample data, hostile file intake, staging, validation, and consolidation.
- Canonical product/SKU/location/inventory data and the live Operating View.
- Approved deterministic inventory recovery scores, opportunities, and Attention Queue.
- Recovery projects, tasks, approvals, and campaign brief drafts.
- Deterministic/template-based permission-aware Retail Copilot explanations.
- Executive, Merchandising, Store Manager, and Viewer workspaces backed by persisted data.
- Security, tenant/location isolation, acceptance, deployment, and rollback evidence for every milestone.

## Implemented / deployed relationship

Phase 0 routes and Phase 0.5 routes exist in the repository. Route existence is not the same as final product acceptance. Acceptance still depends on current validation evidence, tenant-isolation evidence, live deployment evidence, migration history, and known blockers.

Current production deployment inspected during M0-R:

- Commit: `d19a4635d32bfc5b0d26916e3efbd8603e751372`
- Deployment: `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`

## Out of scope

- Seeded demo analytics presented as real intelligence.
- Finalizing navigation structure, dashboard KPIs, card arrangement, module grouping, terminology, statuses, workflows, roles, locations, suppliers, demo records, purchase-order placeholder content, finance navigation, EDI placement, warehouse terminology, or other retail-domain assumptions without retail-consultant validation and product-discovery decisions.
- Static dashboards or product screens presented as final product behavior during M0.9.
- POS, finance, wholesale, accounting, warehouse management, forecasting, advanced agent execution, marketplace publishing, and autonomous Copilot actions.
- Implementing any capability beyond the active milestone.

## M0.9 UI foundation boundary

M0.9 is allowed to establish the shared frontend system, visual language, component architecture, formatting utilities, data-grid system, and configurable placeholder dashboard architecture. The navigation structure, dashboard KPIs, card arrangement, module grouping, terminology, statuses, workflows, roles, locations, suppliers, and demo records introduced during the UI foundation milestone are provisional placeholders. They validate the design system and technical component architecture only. They are not final product requirements and must remain replaceable following retail-consultant validation and product-discovery decisions.

## Phase 0 intelligence boundary

A recovery result must be tenant-scoped, based on persisted known data, include its calculation version and freshness, explain contributing signals and confidence, and never mutate price, stock, publishing, or customer-facing channels in Phase 0.

## Exit criteria

Phase 0 cannot exit until secure foundations and the agreed recovery workflow pass acceptance and security tests; RLS isolation has positive and negative evidence; recovery classifications are explainable; no future-phase implementation is bundled; and release, rollback, monitoring, and incident procedures are reviewed.
