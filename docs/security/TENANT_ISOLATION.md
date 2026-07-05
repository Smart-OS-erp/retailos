# Tenant Isolation

## Invariant

Data belonging to one RetailOS organization must never be readable, writable, inferable, enumerable, cached into, searched by, exported to, or surfaced to another organization without an explicit future cross-organization feature and separate approval.

## Data rules

- Tenant-owned records carry a non-null organization identifier with referential integrity.
- Child records cannot silently disagree with the tenant of their parent; use constraints, composite keys, or validated database functions as appropriate.
- Queries, jobs, cache keys, object paths, analytics events, search indexes, and model retrieval all carry explicit tenant context.
- Unique constraints are tenant-aware unless global uniqueness is intentionally required.
- Exports and backups preserve access controls and retention policy.

## Test pattern

Create two organizations, multiple users and roles, and similarly shaped records. Assert allowed CRUD within scope and denial across scope, including guessed IDs, bulk endpoints, realtime, storage, exports, and background processing.

RLS is the final database guard, not a reason to omit application authorization.
