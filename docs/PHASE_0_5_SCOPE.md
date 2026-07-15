# Phase 0.5 Scope — Integration Hub MVP

## Goal

Move RetailOS beyond manual upload into connected retail data while preserving the Phase 0 validation, consolidation, intelligence, projectisation, and Copilot pipeline.

Phase 0.5 is about safe ingestion from external retail systems. It is not a general integration marketplace, POS layer, warehouse system, finance module, or autonomous execution layer.

## In scope

- Integration Hub navigation and setup flow.
- Data source setup and connection-status tracking.
- Provider records for:
  - CSV / Excel as existing manual input context.
  - Shopify connector scaffold or MVP.
  - WooCommerce connector scaffold or MVP.
  - Google Sheets connector scaffold or MVP.
  - POS / ERP as request/help or import-API path, not direct POS implementation.
  - Custom website as custom backend/import-API path, not direct website scraping.
- RetailOS Import API for tenant-scoped inbound records.
- External record storage with provider/source identifiers.
- Sync jobs with statuses, attempts, idempotency, audit, and errors.
- Webhook event table for received provider events.
- Normalization from raw external records into the existing canonical validation/consolidation pipeline.
- Permission, RBAC, RLS, audit, and secret-management controls for every integration boundary.

## Out of scope

- Full POS.
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
- Any Phase 1+ inventory ledger or operational inventory-control feature.

## Website rule

RetailOS does not connect to "a website" directly as the primary source.

RetailOS connects to the system behind the website:

- Shopify
- WooCommerce
- Magento / Adobe Commerce
- BigCommerce
- custom backend
- POS
- ERP
- spreadsheet feed
- import API

## Acceptance criteria

- A user can create a data source.
- A user can see connection status.
- A user can trigger an allowed sync.
- Sync creates tenant-scoped raw external records.
- Records normalize into canonical staging/validation tables.
- Validation, consolidation, and intelligence pipeline can run after sync.
- Unauthorized users cannot create, read, sync, update, or delete another tenant's data sources or external records.
- Service-role credentials and provider secrets never enter client/browser code.
- Failed syncs are visible, non-destructive, auditable, and retry-safe.
- Connector scaffolds clearly identify unsupported actions instead of faking success.

## Import API boundary

The Import API boundary is documented in `docs/IMPORT_API_BOUNDARY.md`.

The boundary is reviewed and the credential/control-plane foundation now covers
token-hash storage, tenant-scoped credential metadata, idempotency/replay
evidence, and rate-limit evidence. The route is deployed and has passed a
tenant-scoped authenticated production smoke test. The route must derive tenant
scope from a server-verified import credential, not from request body fields.
Imported records must land in `external_records` first and must not bypass
validation, normalization, consolidation, or intelligence gates.

## Connector strategy

Connector depth and retry/rollback rules are recorded in
`docs/PHASE_0_5_CONNECTOR_STRATEGY.md`.

Shopify, WooCommerce, and Google Sheets remain scaffold-only in Phase 0.5 until
real credential handling, provider API calls, and provider-specific
normalization are approved in a separate reviewed PR.

## Security baseline

- Provider secrets must be stored server-side only.
- Every integration row must carry `organization_id`.
- Any location-specific record must carry location scope or be explicitly unresolved.
- Sync jobs must be idempotent and replay-aware.
- Webhook handlers must verify provider authenticity before trusting payloads.
- API keys or tokens must be hashed/encrypted where appropriate and never logged.
- All sensitive connector actions require audit logs.
- RLS must cover data sources, external records, sync jobs, sync errors, webhook events, Import API credentials, idempotency keys, and rate-limit evidence.

## Delivery discipline

Phase 0.5 implementation must proceed through small vertical PRs:

1. schema/security foundation;
2. Integration Hub setup and empty states;
3. Import API;
4. provider scaffold/MVP by provider;
5. pipeline handoff;
6. hosted verification and acceptance.

Do not call Phase 0.5 complete until lint, typecheck, unit, integration, security, build, live hosted checks, and acceptance smoke tests pass.
