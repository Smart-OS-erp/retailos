Next Task:
Complete, review, and merge Phase 0.5 — WooCommerce MVP Worker.

Required before acceptance:

- Integration managers can trigger a server-side credential availability check for WooCommerce MVP data sources.
- The check derives organization scope and data source details from server-side authorization, not trusted form fields.
- The check uses approved server-side secret material only and never exposes provider tokens in browser UI, logs, fixtures, docs, or committed files.
- Unsupported providers and non-MVP connectors continue to fail closed with safe UI messages.
- Missing WooCommerce credentials fail closed and keep the data source in `configuration_required` with `credential_status = 'missing'`.
- Available WooCommerce server credentials mark the data source `connected` with `credential_status = 'configured'` and safe non-secret metadata only.
- WooCommerce manual sync reads server-side credentials only, calls the WooCommerce REST API through a bounded MVP worker, writes only raw `external_records`, and hands off to normalization.
- Worker retries are bounded, authentication failures are non-retryable, provider/network failures are recorded in `sync_errors`, and no connector writes directly to canonical product, location, sales, inventory, intelligence, projectisation, or campaign tables.
- Unit tests cover configured/missing credential checks, fail-closed worker behavior, raw record persistence, provider handoff, and WooCommerce product/inventory mapping.
- Integration Hub UI tests confirm the credential action exists for approved MVP providers and secrets remain absent from browser-facing UI.
- lint, typecheck, test, security, and build pass.

Next Approved Phase 0.5 Work After Acceptance:

- Add scheduled sync only after worker/idempotency/error behavior is accepted.
- Add product/location/sales canonical write approval flows.
- Add automatic intelligence recalculation after normalized imports.
- Implement the Google Sheets provider worker only after scheduled sync/approval/recalculation priorities are explicitly ordered.

Do not start Phase 1. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
