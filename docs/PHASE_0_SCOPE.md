# Phase 0 Scope - Foundation: Inventory Recovery Intelligence

## Goal

Create a secure foundation for inventory recovery intelligence and deliver the smallest trustworthy path from tenant-scoped retail facts to explainable recovery opportunities, projectisation, campaign briefs, tasks, and deterministic Copilot explanations.

## Current delivery mode

Phase 0 product foundations exist in code and production. The historical Phase 0.5 Integration Hub label remains in migrations and reports for development history, but those capabilities are now grouped under Phase 0 integration and data-foundation milestones.

The final Phase 0 milestones are:

- M0.20 - Aso Collective Phase 0 Demo Dataset.
- M0.21 - Phase 0 End-to-End Acceptance and Hardening.

M0.20 is accepted. M0.21 is conditionally accepted. Current active work has moved to Phase 2B after M2.11 acceptance under `harness/milestones.yaml`; M2.12 remains gated by domain review.

## In scope

- Secure SaaS foundation, onboarding, authentication, organisations, memberships, RBAC, RLS, audit logging, and tenant isolation.
- M0.9 RetailOS UI Foundation: shared frontend system architecture, visual language, design tokens, shadcn/ui foundation, shared shell, responsive navigation/topbar primitives, organization switcher, user menu, global search shell, central configuration, tenant-aware market defaults, shared formatting utilities, reusable UI primitives, RetailDataGrid, accessibility baseline, responsive behavior, documentation, and tests.
- Tenant-scoped sample data, hostile file intake, staging, validation, correction, canonical approval, and consolidation.
- Historical Phase 0.5 integration/data-foundation capabilities: Integration Hub, Import API, Shopify/WooCommerce MVP workers, scheduled sync, external records, canonical approval flows, and automatic intelligence recalculation evidence.
- Canonical product/SKU/location/inventory data and Operating View.
- Approved deterministic inventory recovery scores, opportunities, and Attention Queue.
- Recovery projects, tasks, approvals, and campaign brief drafts.
- Deterministic/template-based permission-aware Retail Copilot explanations.
- Executive, Merchandising, Store Manager, and Viewer workspaces backed by persisted data.
- RetailOS African Fashion Retail Operating Model v0.9 as the interim domain baseline pending original consultant review and real retailer pilot validation.
- A deterministic synthetic Aso Collective demo dataset for Phase 0 validation.
- Security, tenant/location isolation, acceptance, deployment, and rollback evidence for every milestone.

## Implemented / deployed relationship

Phase 0, historical Phase 0.5, Phase 1, and Phase 2 M2.0-M2.6 routes and migrations exist in the repository. Route existence is not final product acceptance. Acceptance depends on current validation evidence, tenant-isolation evidence, live deployment evidence, migration history, and known blockers.

Latest inspected production deployment before Phase 2B:

- Commit: `d7f730d8c29f7923df701c5e41cf99f036fa0b57`
- Deployment: `dpl_bggBQ7SmTeTymHkacYpqiBS1LNSp`
- URL: `https://retailos-ten.vercel.app`

## Out of scope

- Seeded demo analytics presented as real recovered customer value.
- Static dashboards or product screens presented as final product behavior.
- Finalizing navigation structure, dashboard KPIs, module grouping, terminology, statuses, workflows, roles, suppliers, warehouse/finance terminology, demo records, or other retail-domain assumptions without consultant validation and product-discovery decisions.
- Phase 2C, Phase 3, purchasing, WMS, finance, omnichannel, POS, payments, wholesale, accounting, advanced forecasting, advanced agent execution, marketplace publishing, autonomous Copilot actions, or production external-system write-back during the current pre-M2.12 technical closure campaign.
- Implementing any capability beyond the active milestone.

## M0.9 UI foundation boundary

M0.9 is allowed to establish the shared frontend system, visual language, component architecture, formatting utilities, data-grid system, and configurable placeholder dashboard architecture. Placeholder navigation, KPIs, roles, statuses, workflows, suppliers, locations, and demo records remain provisional and replaceable.

## Phase 0 intelligence boundary

A recovery result must be tenant-scoped, based on persisted known data, include its calculation version and freshness, explain contributing signals and confidence, and never mutate price, stock, publishing, customer-facing channels, finance, POS, or external systems in Phase 0.

## Exit criteria

Phase 0 cannot exit until M0.21 passes the complete journey from raw source data through validation, correction, identity resolution, canonical approval, consolidation, operating view, confidence, aging, risk, Attention Queue, recovery opportunity, projectisation, campaign brief, tasks, and deterministic Copilot explanation.

M0.21 must record exactly one final status in `reports/PHASE_0_FINAL_DECISION.md`:

- `PHASE_0_ACCEPTED`
- `PHASE_0_CONDITIONALLY_ACCEPTED`
- `PHASE_0_NOT_ACCEPTED`
