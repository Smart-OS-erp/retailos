# Phase 2 Acceptance Matrix - M2.0 to M2.6

Date: July 18, 2026
Status: IMPLEMENTED AND HOSTED-SCHEMA VERIFIED; production deployment pending PR merge.

| Milestone | Evidence | Status |
| --- | --- | --- |
| M2.0 secure contracts | Migration adds merchandising permissions, RLS tables, views, and RPCs. Navigation exposes `/merchandising` only through `merchandising.view`. | Passed locally / hosted schema passed |
| M2.1 product productivity | `product_productivity_metrics` uses persisted inventory, sales facts, and risk evidence. Integration test validates no-sales stock becomes markdown review evidence. | Passed |
| M2.2 group performance | `merchandising_group_performance` aggregates brand, category, and collection views with explicit unassigned collection handling. | Passed |
| M2.3 markdown drafts | `create_markdown_plan_draft` converts a markdown recommendation into a draft without executing prices/promotions. | Passed |
| M2.4 planning contracts | `create_merchandising_plan_cycle`, `add_assortment_plan_item`, and `approve_merchandising_plan_cycle` persist planning state and audit events. | Passed |
| M2.5 recommendations | `generate_merchandising_recommendations` creates directional recommendations with confidence labels and audit evidence. | Passed |
| M2.6 validation | Focused integration test and hosted schema verification exist; docs/reports are updated. | Passed locally / production pending |

## Guardrails confirmed

- No POS, payments, finance/accounting, wholesale, purchase-order execution, supplier workflow, autonomous Copilot action, or advanced forecasting.
- Recommendations are directional and evidence-based.
- Markdown drafts do not execute pricing.
- Planning approvals do not execute stock transfers, buying, or supplier operations.
- Store managers do not receive merchandising planning access.

## Remaining release conditions

- Full final local validation.
- PR checks and Vercel preview.
- Production deployment and route smoke for Phase 2 pages.
- Supabase CLI migration-history/reset verification remains blocked until CLI is installed/authenticated.
