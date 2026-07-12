# Phase 0 to Phase 0.5 Promotion

## Decision

RetailOS is promoted from Phase 0 to Phase 0.5 by founder instruction on 2026-07-12.

New active phase:

Phase 0.5 — Integration Hub MVP

## Basis

- Phase 0 foundation is implemented and deployed.
- Hosted setup/onboarding was user-verified.
- Hosted Phase 0 schema verification passes.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Supabase migration history is repaired for the seven applied Phase 0 migrations.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only.
- Production governance is accepted by founder instruction on 2026-07-12.

## Scope now authorized

- Integration Hub.
- Data source setup.
- Connector scaffold or MVP for Shopify, WooCommerce, and Google Sheets.
- RetailOS Import API.
- Scheduled sync architecture.
- External record storage.
- Sync jobs.
- Sync errors.
- Webhook event table.
- Pipeline handoff into validation, consolidation, and intelligence.

## Still prohibited

- POS.
- Payments.
- Accounting or finance.
- Wholesale.
- Warehouse management.
- Advanced forecasting.
- Marketplace publishing.
- WhatsApp execution.
- Automatic campaign publishing.
- Autonomous markdown, transfer, or stock mutation.
- Real LLM agent execution.
- Phase 1+ inventory ledger or operational stock-control features.

## Immediate next step

Build Phase 0.5 Milestone 0 and Milestone 1 in a scoped PR:

1. finalize connector depth and security contract;
2. add Integration Hub schema foundation with RLS and tests;
3. keep connector credentials server-only;
4. preserve the existing validation/consolidation/intelligence approval path.

Do not implement provider-specific fake success flows. Scaffold-only connectors must clearly say they are not connected yet.

## Promotion-record validation

Validated locally on branch `accept-hosted-email-behavior` after recording production governance acceptance and Phase 0.5 promotion:

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test` — passed: 15 files and 69 tests.
- `npm run build` — passed.
- `npm run security` — passed.

Hosted Supabase live tests were not rerun for this promotion-record update because no hosted database, Auth, or environment setting changed.
