# Phase 1 Scope — Core Inventory Operating System

## Goal

Turn RetailOS from inventory recovery intelligence into a secure inventory
operating layer for stock visibility, controlled movements, adjustments,
transfers, counts, reconciliation, and lookup.

Phase 1 remains inventory-control focused. It is not a full ERP, POS, finance,
wholesale, warehouse-management, or forecasting phase.

## Current approved milestones

This slice approves backend-only foundations for:

1. inventory movement ledger;
2. stock adjustment request and approval;
3. transfer request and approval;
4. stock count and variance/reconciliation evidence;
5. inventory search by SKU, barcode, product name, and effective location scope.

## Security rules

- Tenant isolation remains mandatory at database, API, and UI layers.
- Location-scoped users can only read or act inside assigned locations.
- Inventory-control writes must use permissioned server/database functions.
- Direct client/browser writes to operational inventory tables are not allowed.
- Every approval or submitted operational action must be audit logged.
- Movement ledger rows must retain source object lineage.
- No service-role credential may be used for normal user inventory operations.

## Out of scope

- POS or payment flows.
- Accounting, finance, landed cost, or profitability modules.
- Full warehouse-management workflows.
- Forecasting, reorder automation, or markdown optimization.
- Autonomous Copilot execution.
- Dashboards or product UI screens for this backend-foundation slice.
- Fake current-stock mutation based on static constants.

## Acceptance

Phase 1 milestones are accepted only when:

- migration contracts are RLS-protected and pass security checks;
- positive and negative integration tests cover tenant and location boundaries;
- lint, typecheck, tests, security, and build pass;
- production deployment and hosted migration state are known;
- reports and known blockers are updated honestly.
