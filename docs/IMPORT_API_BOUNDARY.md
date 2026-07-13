# RetailOS Import API Boundary

## Status

Phase: Phase 0.5 — Integration Hub MVP.

Mode: reviewed boundary plus route implementation. The current implementation
adds Import API credential metadata, token-hash storage, idempotency/replay
evidence, rate-limit evidence, and `POST /api/import/v1/records`. It does not
implement a connector worker or normalization job.

The RetailOS Import API is the approved path for tenant-scoped records from
custom backends, spreadsheet feeds, POS/ERP exports, and partner systems when a
native connector is not yet available.

## Non-goals

The Import API must not become:

- a public unauthenticated ingestion endpoint;
- a POS transaction layer;
- a finance, wholesale, warehouse, or forecasting module;
- a way to bypass validation and consolidation approval;
- a place to store provider secrets in `data_sources`;
- a browser-exposed credential flow.

## Endpoint shape

Implemented route:

```text
POST /api/import/v1/records
```

Required headers:

```text
Authorization: Bearer <RetailOS import token>
Content-Type: application/json
Idempotency-Key: <client-generated request key>
```

Optional headers:

```text
X-RetailOS-Source-Key: <data source source_key>
X-RetailOS-Request-Timestamp: <ISO-8601 timestamp>
```

The request must not accept `organization_id` from the caller. Tenant scope is
derived from the authenticated import credential and its bound data source.

## Authentication contract

Import API credentials must be:

- generated server-side only;
- visible once at creation time and never stored in plaintext;
- stored as a keyed hash, not as raw token text;
- scoped to exactly one `organization_id` and one `data_source_id`;
- tied to a provider whose source system is `import_api`, `custom_backend`, or
  a specifically approved integration feed;
- revocable without deleting the `data_sources` row;
- rotatable with overlapping grace only when explicitly requested;
- created only by a user with `integration.manage`;
- never readable by browser code after creation.

Implemented credential table:

```text
import_api_credentials
```

Minimum fields:

- `id`
- `organization_id`
- `data_source_id`
- `token_hash`
- `token_prefix`
- `hash_algorithm`
- `status`
- `created_by`
- `created_at`
- `expires_at`
- `revoked_at`
- `revoked_by`
- `last_used_at`

Implemented replay/rate-limit tables:

- `import_api_idempotency_keys`
- `import_api_rate_limit_events`

The token verification path must use constant-time comparison where practical
and must not reveal whether a token prefix, data source, organization, or status
was the failing part.

## Authorization and tenant scope

After token verification, the route must:

1. Resolve the credential.
2. Resolve the bound `data_sources` row.
3. Confirm the data source belongs to the credential's organization.
4. Confirm the data source is not `disabled` or `paused`.
5. Confirm the data source is approved for Import API ingestion.
6. Insert only rows using the resolved `organization_id` and `data_source_id`.

The route must never use a caller-supplied tenant identifier. If a future payload
includes organization metadata for diagnostics, it must be treated as untrusted
payload only.

## Request payload contract

Request body:

```json
{
  "records": [
    {
      "record_type": "inventory_snapshot",
      "source_record_key": "sku-001|lekki|2026-07-13",
      "source_updated_at": "2026-07-13T09:00:00Z",
      "location_code": "LAG-LEK",
      "payload": {}
    }
  ]
}
```

Initial accepted `record_type` values should be narrow and mapped explicitly:

- `inventory_snapshot`
- `sales_history`
- `product_master`
- `store_master`

Limits:

- JSON only.
- Maximum request body: 1 MB.
- Maximum records per request: 100.
- Maximum `payload` per record: 64 KB before persistence.
- `record_type` must match the approved allowlist.
- `source_record_key` must be present and stable for idempotency.
- `payload` must be a JSON object, not arbitrary text or executable content.

The route must reject malformed, oversized, unknown, or mixed-trust payloads
before persistence.

## Idempotency and replay

There are two idempotency layers.

### Request idempotency

`Idempotency-Key` is required for every request.

The route creates or reuses a `sync_jobs` row with:

- `organization_id`
- `data_source_id`
- `trigger = api`
- `idempotency_key`

The existing database uniqueness contract on `(organization_id, data_source_id,
idempotency_key)` must be preserved.

If the same credential sends the same idempotency key again:

- same payload hash: return the original result;
- different payload hash: reject with a conflict-style safe error.

### Record idempotency

Each imported record must persist to `external_records` using the existing unique
contract:

```text
(organization_id, data_source_id, record_type, source_record_key)
```

Duplicate record submissions must not create duplicate external records.

## Persistence model

The Import API may write to:

- `sync_jobs`
- `external_records`
- `sync_errors`
- `audit_events`

It must not write directly to:

- `products`
- `skus`
- `inventory_snapshots`
- `inventory_positions`
- `sales_facts`
- intelligence tables
- projectisation tables

Canonical tables may only be affected by later validation, normalization,
consolidation, and approval workflows.

## Error model

Errors must be stable and non-sensitive.

Examples:

- `authentication_required`
- `permission_denied`
- `invalid_content_type`
- `payload_too_large`
- `invalid_payload`
- `unsupported_record_type`
- `idempotency_conflict`
- `data_source_not_importable`
- `rate_limited`

Responses must include a correlation identifier. Diagnostic detail belongs in
server logs or audit/error rows, not in the client response.

## Audit and observability

The implementation must audit:

- credential creation;
- credential rotation;
- credential revocation;
- accepted import request;
- rejected import request where a data source can be safely identified;
- idempotency conflict;
- payload validation failure;
- external-record persistence failure.

Metrics to track:

- requests by data source;
- accepted records;
- rejected records;
- duplicate records;
- sync job status;
- rate-limit events;
- payload size distribution;
- downstream normalization failures.

## Rate limits

Initial limits should be conservative:

- per credential;
- per organization;
- per source IP where available;
- per route.

Rate-limit failure must be safe and must not reveal whether the token itself was
valid.

## Required tests before implementation is accepted

Security tests:

- anonymous request denied;
- missing token denied;
- malformed token denied;
- revoked token denied;
- expired token denied;
- token for Tenant A cannot write Tenant B records;
- caller-supplied `organization_id` is ignored or rejected;
- unsupported data source denied;
- browser/client code cannot access import token material;
- service role is not used for normal import traffic.

API tests:

- non-JSON content type rejected;
- oversized body rejected;
- too many records rejected;
- unsupported `record_type` rejected;
- invalid `source_record_key` rejected;
- duplicate idempotency key with same payload reuses result;
- duplicate idempotency key with different payload is rejected;
- duplicate external record does not duplicate persistence;
- sync job and sync error rows are created correctly;
- imported records remain external/untrusted until normalization.

Data tests:

- external records carry `organization_id`;
- external records carry `data_source_id`;
- optional location resolution does not cross tenants;
- validation/consolidation/intelligence pipeline is not bypassed.

## Implementation gate

Do not broaden `/api/import/v1/records` beyond external-record ingestion until
the route is reviewed, deployed with `IMPORT_API_TOKEN_HASH_SECRET`, and smoke
tested against a real tenant-scoped Import API credential. The route must
continue using the credential/idempotency foundation instead of ad hoc storage.
