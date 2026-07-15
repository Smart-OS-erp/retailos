# Phase 0.5 Connector Strategy

## Decision

Phase 0.5 keeps Shopify, WooCommerce, and Google Sheets at **scaffold-only** depth until a later reviewed PR approves real credential storage, provider API access, and provider-specific normalization.

| Provider | Phase 0.5 depth | Manual sync behavior now | Real credentials now | Rationale |
| --- | --- | --- | --- | --- |
| Shopify | `scaffold` | Allowed to request a sync envelope; fails closed while credentials are missing | No | Shopify OAuth/webhooks need a separate secret, consent, webhook authenticity, and rate-limit design. |
| WooCommerce | `scaffold` | Allowed to request a sync envelope; fails closed while credentials are missing | No | WooCommerce key storage and site-specific API risk must be reviewed before live API access. |
| Google Sheets | `scaffold` | Allowed to request a sync envelope; fails closed while credentials are missing | No | Google OAuth/service-account handling and sheet sharing boundaries need explicit approval before access. |
| RetailOS Import API | `api` | Accepted through the deployed Import API route after tenant-scoped bearer credential verification | Server-only token hash secret only | Import API is the approved Phase 0.5 live ingestion path for custom backends and feeds. |
| CSV / Excel | `manual` | No Integration Hub sync worker | Not required | Existing upload flow remains manual and must continue through validation before consolidation. |

The provider catalogue may expose these systems to users as setup options, but it must not imply that Shopify, WooCommerce, or Google Sheets are connected until real credential handling is implemented and verified.

## Credential boundary

- Provider access tokens, OAuth secrets, WooCommerce keys, Google credentials, webhook secrets, database credentials, and Supabase service-role keys must never be stored in `data_sources.connection_metadata`, client components, browser bundles, fixtures, screenshots, or committed files.
- Provider credential implementation must be server-only and encrypted or otherwise protected according to the approved secret-management design before any connector moves from `scaffold` to `mvp`.
- Browser-facing Integration Hub UI may display provider status, credential status, and safe help text only.
- Scaffold providers must keep `credential_status = 'missing'` until a reviewed provider-specific credential flow exists.

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
first pipeline handoff for `inventory_snapshot` external records is documented
in `docs/PHASE_0_5_PIPELINE_HANDOFF.md`. Provider-specific workers and
additional record-type mappings are still not implemented.

## Phase leakage guardrails

This strategy does not authorize:

- POS implementation;
- finance, accounting, wholesale, or warehouse management;
- marketplace publishing;
- automatic campaign execution;
- autonomous markdown or transfer execution;
- advanced forecasting;
- real LLM agent execution.

Any future connector MVP must remain limited to Phase 0.5 ingestion and pipeline handoff.
