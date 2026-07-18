Next Task:
Complete, review, and merge Phase 0.5 — Automatic Intelligence Recalculation.

Required before acceptance:

- Approved inventory consolidation automatically records tenant-scoped recalculation evidence.
- Approved inventory consolidation triggers the existing deterministic Inventory Recovery Intelligence engine only after the approved snapshot is fully written.
- Recalculation attempts are RLS-protected, audit logged, idempotent per source event, and readable only to authorized tenant users.
- Product master, store master, and sales history approval flows record honest skipped recalculation evidence until Phase 0 scoring consumes those canonical record types.
- No connector writes directly to intelligence, projectisation, campaign, or future Phase 1 inventory-ledger tables.
- Integration tests cover automatic inventory-consolidation recalculation and skipped product/store/sales recalculation evidence.
- lint, typecheck, test, security, and build pass.

Next Approved Work After Acceptance:

- Human-approved promotion to Phase 1 — Core Inventory Operating System.
- Start Phase 1 with small vertical milestones:
  1. inventory ledger schema and RLS foundation;
  2. stock adjustment request/approval foundation;
  3. transfer request/approval foundation;
  4. stock count and variance foundation;
  5. inventory search/barcode lookup foundation.

Do not add POS, finance, wholesale, forecasting, warehouse management beyond the approved Phase 1 inventory-control scope, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
