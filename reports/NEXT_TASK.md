Next Task:
Complete, review, and merge Phase 0.5 — Provider Credential Onboarding.

Required before acceptance:

- Integration managers can trigger a server-side credential availability check for Shopify MVP data sources.
- The check derives organization scope and data source details from server-side authorization, not trusted form fields.
- The check uses approved server-side secret material only and never exposes provider tokens in browser UI, logs, fixtures, docs, or committed files.
- Unsupported providers and non-MVP connectors fail closed with safe UI messages.
- Missing Shopify credentials fail closed and keep the data source in `configuration_required` with `credential_status = 'missing'`.
- Available Shopify server credentials mark the data source `connected` with `credential_status = 'configured'` and safe non-secret metadata only.
- Unit tests cover configured, missing, unsupported-provider, and non-MVP credential checks.
- Integration Hub UI tests confirm the credential action exists and secrets remain absent from browser-facing UI.
- lint, typecheck, test, security, and build pass.

Next Approved Phase 0.5 Work After Acceptance:

- Implement one remaining provider worker at a time, likely WooCommerce or Google Sheets.
- Add scheduled sync only after worker/idempotency/error behavior is accepted.
- Add product/location/sales canonical write approval flows.
- Add automatic intelligence recalculation after normalized imports.

Do not start Phase 1. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
