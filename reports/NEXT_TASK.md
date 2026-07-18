Next Task:
Complete, review, and merge Phase 0.5 — Canonical Write Approval Flows.

Required before acceptance:

- Product master review rows require explicit approval before products/SKUs are created or updated.
- Store master review rows require explicit approval before locations are created or updated.
- Sales history review rows require explicit approval before sales facts are created.
- Approval requires authenticated `data.manage`, exact upload digest, review row-count consistency, and clear or accepted validation issues.
- Approval runs are tenant-scoped, RLS-readable, audited, and idempotent.
- No connector writes directly to canonical products, locations, sales facts, inventory, intelligence, projectisation, or campaign tables.
- Integration tests cover product, store, and sales approval flows and product approval idempotency.
- lint, typecheck, test, security, and build pass.

Next Approved Phase 0.5 Work After Acceptance:

- Add automatic intelligence recalculation after normalized imports.
- Implement the Google Sheets provider worker only after scheduled sync/approval/recalculation priorities are explicitly ordered.

Do not start Phase 1. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
