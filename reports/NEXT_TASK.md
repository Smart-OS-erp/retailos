Next Task:
Continue Phase 1 - Core Inventory Operating System after M6 review.

Recommended next milestones:

1. Finish M6 release process:
   - review PR;
   - apply hosted migration `20260718103000_phase1_inventory_operations_core.sql`;
   - deploy accepted code;
   - run production route/runtime smoke.
2. Stock-count review and closure:
   - review submitted counts;
   - resolve/dismiss reconciliation issues;
   - optionally create approved count-correction movements.
3. Low/overstock watchlist:
   - derive from persisted inventory facts;
   - remain tenant/location scoped;
   - do not invent demand forecasts.
4. Inventory search/barcode UI:
   - use persisted SKU/product/location data;
   - respect location scope;
   - avoid POS or checkout behavior.

Do not build dashboards or broad UI screens outside approved Phase 1 inventory-control workflows.

Do not add POS, finance, wholesale, forecasting, warehouse-management expansion beyond approved inventory-control scope, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
