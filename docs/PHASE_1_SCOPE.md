# Phase 1 Scope — Core Inventory Operating System

## Goal

Turn RetailOS from inventory recovery intelligence into a secure inventory
operating layer for stock visibility, controlled movements, adjustments,
transfers, counts, reconciliation, and lookup.

Phase 1 remains inventory-control focused. It is not a full ERP, POS, finance,
wholesale, warehouse-management, or forecasting phase.

## Approved milestones

### M1-M5 — Inventory core foundations

The merged foundation slice approved backend contracts for:

1. inventory movement ledger;
2. stock adjustment request and approval;
3. transfer request and approval;
4. stock count and variance/reconciliation evidence;
5. inventory search by SKU, barcode, product name, and effective location scope.

### M6 — Inventory Operations Core

This milestone extends the foundation into real operational workflows:

1. current inventory balances by SKU and location, derived from approved
   inventory snapshots plus movement ledger rows;
2. stock adjustment request, approve, reject, execute, and reverse workflow;
3. transfer request, approve, reject, dispatch, partial receive, full receive,
   and discrepancy evidence workflow;
4. idempotency evidence for stock-affecting execution, reversal, dispatch, and
   receipt actions;
5. shared-shell Phase 1 UI for current positions, movements, adjustments, and
   transfers.

M6 does not approve broad dashboards, POS, procurement, finance, wholesale,
advanced forecasting, or warehouse-management expansion.

### M1.9 — Inventory Operating System Completion

This final Phase 1 milestone completes the approved inventory-control slice:

1. stock-count review and closure workflow;
2. reconciliation issue resolution/dismissal decisions;
3. optional approved count-correction movement posting;
4. persisted-evidence inventory watchlist for out-of-stock, low-stock,
   overstock, and in-transit follow-up;
5. inventory lookup UI for SKU, barcode, and product search within effective
   location scope;
6. hosted schema verification coverage for the final Phase 1 objects.

M1.9 remains inventory-control focused. Watchlist signals are rule-based from
persisted balances and historical sales evidence; they are not demand
forecasts, reorder automation, markdown optimization, POS, finance, procurement,
or warehouse-management expansion.

## Security rules

- Tenant isolation remains mandatory at database, API, and UI layers.
- Location-scoped users can only read or act inside assigned locations.
- Inventory-control writes must use permissioned server/database functions.
- Direct client/browser writes to operational inventory tables are not allowed.
- Every approval or submitted operational action must be audit logged.
- Movement ledger rows must retain source object lineage.
- Stock-affecting actions must use transactional database functions with
  idempotency keys and conservative movement-ledger locking.
- Transfer receipts must keep discrepancy evidence visible until reconciled.
- No service-role credential may be used for normal user inventory operations.

## Out of scope

- POS or payment flows.
- Accounting, finance, landed cost, or profitability modules.
- Full warehouse-management workflows.
- Forecasting, reorder automation, or markdown optimization.
- Autonomous Copilot execution.
- Dashboards or product UI screens outside the approved inventory-operations
  workflow.
- Fake current-stock mutation based on static constants.

## Acceptance

Phase 1 milestones are accepted only when:

- migration contracts are RLS-protected and pass security checks;
- positive and negative integration tests cover tenant and location boundaries;
- operational tests cover adjustment execute/reverse idempotency and transfer
  dispatch/partial/full receipt behavior;
- stock-count tests cover review, issue closure, count-correction idempotency,
  and watchlist derivation from persisted balances;
- lint, typecheck, tests, security, and build pass;
- production deployment and hosted migration state are known;
- reports and known blockers are updated honestly.
