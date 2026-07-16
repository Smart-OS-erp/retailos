# Phase 0.5 Connector Strategy

## Decision

Founder approval moved Shopify, WooCommerce, and Google Sheets to **MVP-approved** depth for Phase 0.5. Shopify, WooCommerce, and Google Sheets at **MVP-approved** depth change the provider/data-source contract from `scaffold` to `mvp`; this does not permit secrets in the browser, fake connected states, or direct writes into canonical retail tables.

| Provider | Phase 0.5 depth | Manual sync behavior now | Real credentials now | Rationale |
| --- | --- | --- | --- | --- |
| Shopify | `mvp` | Runs the server-only Shopify MVP worker when the data source is credential-configured; fails closed while credentials are missing or unavailable | Server-side only via ignored environment/secret management; no browser or `connection_metadata` storage | Shopify may be configured as a Phase 0.5 MVP source, but provider OAuth/webhook secrets must stay server-only and rate-limited. |
| WooCommerce | `mvp` | Runs the server-only WooCommerce MVP worker when the data source is credential-configured; fails closed while credentials are missing or unavailable | Server-side only via ignored environment/secret management; no browser or `connection_metadata` storage | WooCommerce may be configured as a Phase 0.5 MVP source, but consumer keys/secrets must stay server-only and tenant-scoped. |
| Google Sheets | `mvp` | Allowed to request a sync envelope; fails closed while credentials are missing | Server-side only, not yet configured in repo | Google Sheets may be configured as a Phase 0.5 MVP source, but OAuth/service-account credentials must stay server-only and tenant-scoped. |
| RetailOS Import API | `api` | Accepted through the deployed Import API route after tenant-scoped bearer credential verification | Server-only token hash secret only | Import API is the approved Phase 0.5 live ingestion path for custom backends and feeds. |
| CSV / Excel | `manual` | No Integration Hub sync worker | Not required | Existing upload flow remains manual and must continue through validation before consolidation. |
| POS / ERP | `scaffold` | No direct POS/ERP sync worker | No | POS/ERP remains an onboarding-help or Import API path; direct POS work is future-phase unless separately approved. |
| Custom backend | `scaffold` | Use Import API or reviewed feed path | Server-only only when implemented | RetailOS connects to the backend/feed behind a website, not by scraping a website. |

The provider catalogue may expose Shopify, WooCommerce, and Google Sheets as MVP setup options, but it must not imply that any provider is connected until server-side credentials are configured and verified.

The provider credential onboarding milestone adds narrow Shopify and WooCommerce server-side credential availability checks. It verifies whether approved server environment/secret-manager material can be resolved for the data source, then updates the source status without exposing secret values. It does not add OAuth, browser secret entry, Google Sheets credentials, webhook authentication, or direct provider secret storage in application tables.

## Credential boundary

- Provider access tokens, OAuth secrets, WooCommerce keys, Google credentials, webhook secrets, database credentials, and Supabase service-role keys must never be stored in `data_sources.connection_metadata`, client components, browser bundles, fixtures, screenshots, or committed files.
- Provider credential implementation must be server-only and encrypted or otherwise protected according to the approved secret-management design before any MVP connector can perform live provider API access.
- The Phase 0.5 Shopify MVP worker reads optional `SHOPIFY_CONNECTOR_CREDENTIALS_JSON` only from ignored server environment/secret management. The value must map a reviewed `data_source_id` or safe source key to a Shopify shop domain and Admin API token. Do not paste the value into chat, docs, screenshots, fixtures, Git, or client code.
- The Phase 0.5 WooCommerce MVP worker reads optional `WOOCOMMERCE_CONNECTOR_CREDENTIALS_JSON` only from ignored server environment/secret management. The value must map a reviewed `data_source_id` or safe source key to an HTTPS WooCommerce site URL, consumer key, consumer secret, and optional REST API version. Do not paste the value into chat, docs, screenshots, fixtures, Git, or client code.
- Browser-facing Integration Hub UI may display provider status, credential status, and safe help text only.
- MVP providers must keep `credential_status = 'missing'` until a reviewed provider-specific credential flow or approved server-side secret entry exists and the server-side verifier records availability.

## Sync retry and rollback contract

No scheduled sync worker is enabled yet. When a worker is approved, it must follow this contract:

1. Create or reuse a tenant-scoped `sync_jobs` row using an idempotency key before provider access.
2. Re-check organization membership, RBAC, data-source status, connector depth, and credential status server-side.
3. Use bounded retries only for retryable external failures:
   - maximum 3 provider/network attempts per sync job;
   - exponential backoff with jitter;
   - no retry for authentication, authorization, disabled source, malformed mapping, duplicate idempotency conflict, or policy failures.
4. Write provider payloads only to tenant-scoped `external_records` first.
5. Record every non-success as `sync_errors` with `retryable` set honestly.
6. Never write directly from a connector into canonical inventory, sales, intelligence, projectisation, or campaign tables.
7. On partial failure, leave successful raw records persisted, mark the job `partially_succeeded`, and record record-level errors.
8. On fatal failure before any record is accepted, mark the job `failed`, preserve the error evidence, and do not mutate canonical data.
9. Rollback means stopping or compensating the sync job envelope and downstream staging attempts; raw external-record evidence is retained for audit unless retention policy later requires deletion.
10. Retrying a sync must be idempotent for the same organization, data source, provider record key, and idempotency key.

## Pipeline handoff rule

Connector output must follow this path:

```text
Provider/API payload
→ sync_jobs
→ external_records
→ normalization to staging rows
→ validation issues
→ approval before consolidation
→ canonical records
→ intelligence/projectisation recalculation
```

The Import API currently implements the raw ingestion part of this path. The
pipeline handoff for `inventory_snapshot`, `product_master`, `store_master`,
and `sales_history` external records is documented in
`docs/PHASE_0_5_PIPELINE_HANDOFF.md`. The Shopify and WooCommerce MVP workers
write `product_master` and `inventory_snapshot` raw external records, then hand
off to `normalize_external_records(sync_job_id)` through the authenticated
server action. Google Sheets, scheduled workers, webhooks, browser credential
entry, and OAuth flows are still not implemented.

## Phase leakage guardrails

This strategy does not authorize:

- POS implementation;
- finance, accounting, wholesale, or warehouse management;
- marketplace publishing;
- automatic campaign execution;
- autonomous markdown or transfer execution;
- advanced forecasting;
- real LLM agent execution.

Any connector MVP work must remain limited to Phase 0.5 ingestion and pipeline handoff.
