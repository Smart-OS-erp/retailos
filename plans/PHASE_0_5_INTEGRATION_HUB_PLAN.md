# Phase 0.5 Integration Hub Plan

## Status and authority

Active phase: Phase 0.5 — Integration Hub MVP.

Authority: founder instruction on 2026-07-12 accepted production governance and approved moving from Phase 0 to Phase 0.5.

This plan authorizes Integration Hub MVP work only. It does not authorize POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.

## Milestone 0 — Scope and security contract

Deliverables:

- confirm connector depth for Shopify, WooCommerce, and Google Sheets: scaffold-only or MVP;
- define provider-secret storage and rotation rules;
- define data-source permission matrix;
- define webhook authenticity requirements;
- define sync idempotency, retry, and replay rules;
- define external-record normalization contract into the existing validation/consolidation pipeline.

Gate:

- no real connector authentication or scheduled sync behavior until the security contract is documented and reviewed.

Status:

- Connector depth, credential boundaries, retry/rollback behavior, and pipeline
  handoff rules are recorded in `docs/PHASE_0_5_CONNECTOR_STRATEGY.md`.
- Shopify, WooCommerce, and Google Sheets are scaffold-only until a separate
  provider-specific MVP PR is approved.

## Milestone 1 — Integration Hub schema foundation

Deliverables:

- `integration_providers`;
- `data_sources`;
- `external_records`;
- `sync_jobs`;
- `sync_errors`;
- `webhook_events`;
- audit events for create/connect/sync/fail/disable actions;
- RLS policies for all tenant-owned tables;
- database functions for permission-checked state transitions where needed.

Gate:

- every tenant table has RLS;
- two-tenant tests prove isolation;
- service-role is not required for normal user actions;
- migrations are additive and rollback-aware.

## Milestone 2 — Integration Hub setup UI

Deliverables:

- Integration Hub entry point;
- source-type selection;
- connection status cards;
- empty states;
- permission-aware create/update/disable actions;
- onboarding question: "How do you currently manage inventory and sales?"

Allowed options:

- CSV / Excel
- Shopify
- WooCommerce
- Google Sheets
- POS / ERP
- custom website
- not sure
- request onboarding help

Gate:

- users can create a data source;
- users can see status;
- unauthorized roles cannot mutate sources;
- no fake connected state.

## Milestone 3 — RetailOS Import API

Deliverables:

- tenant-scoped API authentication contract;
- external record ingestion route;
- payload size/type limits;
- idempotency key handling;
- validation issue creation;
- audit logging;
- safe errors.

Gate:

- anonymous requests denied;
- cross-tenant submissions denied;
- malformed payloads fail closed;
- duplicate idempotency keys do not duplicate records.

## Milestone 4 — Provider scaffold or MVP

Deliverables depend on approved connector depth.

For scaffold-only providers:

- provider metadata;
- setup placeholders that say what is not yet connected;
- no fake sync success;
- request-help path.

For MVP providers:

- server-side secret handling;
- manual trigger sync;
- raw external record storage;
- sync errors and retry status;
- provider-specific mapping into the canonical pipeline.

Gate:

- credentials never reach the browser;
- provider failures are non-destructive and visible;
- sync produces external records or explicit errors;
- records cannot bypass validation/consolidation approval.

## Milestone 5 — Pipeline handoff

Deliverables:

- normalization from external records to staging rows;
- validation issue generation;
- approval before consolidation;
- data health updates;
- intelligence recalculation trigger or queued follow-up.

Gate:

- external records do not directly mutate canonical inventory;
- validation/consolidation/intelligence run on persisted tenant-scoped data;
- audit trail connects source, sync job, staging row, and canonical output.

Status:

- First handoff implemented for `inventory_snapshot` records in
  `public.normalize_external_records(target_sync_job_id uuid)`.
- Product master, sales history, and store master mapping remain pending.
- Canonical inventory still requires the existing consolidation approval path.

## Validation commands

Before each implementation PR handoff:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run security
```

When hosted schema or database behavior changes:

```bash
npm run test:live-phase0-schema
npm run test:live-supabase
```

Add Phase 0.5-specific unit, integration, security, and smoke tests as the implementation appears.
