Next Task:
Continue Phase 1 — Core Inventory Operating System workflow hardening.

Recommended next milestones:

1. Movement reversal/void governance:
   - add reversal source lineage;
   - prevent silent movement deletion;
   - audit reversal approvals.
2. Transfer receiving workflow:
   - model dispatch/receive states;
   - record receiving variance;
   - keep transfer movements auditable.
3. Stock-count review and closure:
   - review submitted counts;
   - resolve/dismiss reconciliation issues;
   - optionally create approved count-correction movements.
4. Low/overstock watchlist:
   - derive from persisted inventory facts;
   - remain tenant/location scoped;
   - do not invent demand forecasts.
5. API/server-action wrappers:
   - wrap approved database RPCs;
   - enforce auth and safe error handling;
   - keep service-role credentials out of client/browser code.

Do not build dashboards or broad UI screens until the Phase 1 backend workflow contracts are accepted.

Do not add POS, finance, wholesale, forecasting, warehouse-management expansion beyond approved inventory-control scope, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
