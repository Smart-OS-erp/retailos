# Phase 1 Acceptance Matrix

Date: July 18, 2026
Status: CONDITIONALLY ACCEPTED

Phase 1 is conditionally accepted because the core inventory workflows are implemented with persisted database state, RBAC/RLS checks, idempotent operations, audit evidence, local integration coverage, hosted schema verification, and live hosted workflow smoke. Remaining conditions are release-governance items, not known workflow failures.

## Acceptance coverage

| Area | Evidence | Status |
| --- | --- | --- |
| Inventory ledger | Approved snapshots plus `inventory_movements` drive `current_inventory_balances`. Adjustment, transfer, and count-correction workflows post persisted movements. | Passed |
| Stock adjustments | Request, approve, execute, idempotent retry, reverse, and audit behavior are covered by integration and live smoke. | Passed |
| Transfers | Request, approve, dispatch, idempotent dispatch, partial receipt, final receipt, in-transit reconciliation, discrepancy evidence, and audit behavior are covered. | Passed |
| Stock counts | Submit, review, close, issue decisions, idempotent closure, and optional correction movements are covered. | Passed |
| Inventory search | SKU lookup works through database RPC and respects location-scoped permissions. | Passed |
| Watchlist | Derived watchlist signals remain persisted-evidence and non-forecasting. User-saved watchlist add/update/remove is permissioned, idempotent for duplicate saves, and audited. | Passed |
| RBAC and location scope | Viewer, suspended membership, and unassigned store-manager negative paths fail closed in tests and live smoke. | Passed |
| Tenant isolation | Existing live Supabase isolation and Phase 1 integration tests preserve tenant scoping. | Passed |
| Audit events | Critical actions emit audit events checked by integration/live smoke. | Passed |
| UI foundation use | Phase 1 pages use AppShell, RetailDataGrid, shared status presentation, and market formatting. | Passed |
| Production deployment | Production is currently on merged M1.9 commit `478db13070f5504ef5291374556a1751c7591280`; this acceptance branch still needs merge/deploy smoke. | Conditional |
| Supabase migration history | Hosted SQL application is verified, but Supabase CLI migration-history/reset is unavailable in this shell. | Conditional |

## Non-goals confirmed

- No POS or payments.
- No finance/accounting module.
- No wholesale module.
- No autonomous Copilot execution.
- No fake forecasting precision.
- No static dashboard accepted as product truth.

## Final Phase 1 status

CONDITIONALLY ACCEPTED.

Conditions to clear:

1. Merge this acceptance PR and verify production route smoke for affected routes.
2. Install/authenticate Supabase CLI and record migration-history/reset evidence, or document a founder-approved hosted-SQL exception.
