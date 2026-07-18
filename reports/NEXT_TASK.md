Next Task:
Complete, review, and merge Phase 1 — Inventory Core Foundations M1–M5.

Milestones in this PR:

1. Inventory movement ledger schema and RLS foundation.
2. Stock adjustment request/approval foundation.
3. Transfer request/approval foundation.
4. Stock count and variance/reconciliation foundation.
5. Inventory search and barcode/SKU lookup foundation.

Required before acceptance:

- All new tenant-owned tables have RLS enabled, FORCE RLS, authenticated select policies, anon revocation, and no direct browser/client write path.
- All inventory-control writes go through permissioned database functions.
- Location-scoped users can only read or act within assigned locations.
- Cross-tenant stock adjustments, transfers, counts, movement reads, and search results are denied.
- Stock adjustment approval writes audited `inventory_movements`.
- Transfer approval writes paired `transfer_out`/`transfer_in` movement ledger rows.
- Stock counts persist count items and create reconciliation issues for variance.
- Inventory search uses approved current inventory positions and supports SKU/barcode/product-name lookup within effective location scope.
- No dashboards, UI screens, POS, finance, wholesale, forecasting, warehouse-management expansion, marketplace publishing, autonomous campaign execution, or real LLM agent execution are added.
- lint, typecheck, test, security, and build pass.

Next Approved Work After Acceptance:

- Phase 1 incremental workflow hardening, likely:
  - movement reversal/void governance;
  - transfer receiving workflow;
  - stock-count review/closure workflow;
  - low/overstock watchlist from persisted inventory facts;
  - API/server-action wrappers for the approved database contracts.

Do not build UI dashboards or future phases until the backend contracts are accepted.
