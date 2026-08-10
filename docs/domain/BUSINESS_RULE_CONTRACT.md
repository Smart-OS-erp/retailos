# RetailOS Business Rule Contract

Rule version: `retailos-operating-model-v0.9.0`

Validation level: `INTERIM_DOMAIN_BASELINE`

This contract makes currently implemented business rules explicit and traceable. It does not move all calculation into one language. SQL materialization, TypeScript reference implementations, UI, Copilot, and tests must reference the same rule/version and must not invent competing semantics.

## Rule architecture

- Authoritative domain language: `docs/domain/RETAIL_OPERATING_MODEL_V0_9.md`.
- Typed reference implementation: `src/lib/business-rules/retail-rules.ts`.
- Deterministic golden fixtures: `data/demo/aso-collective/versions/ASO_MERCHANDISING_PILOT_V3/golden-outcomes.json`.
- Consistency tests: `tests/domain/retail-rule-contract.test.ts`.
- SQL implementations: Supabase migrations and views must expose rule/version fields where available and be mapped back to this contract.

## Covered rules

| Rule | Current contract |
| --- | --- |
| Inventory available quantity | On Hand - Reserved - Quarantined - Damaged - Protected Presentation Qty - Committed Outbound Qty, floored at zero for normal workflow availability. |
| Inventory position | Current persisted position by SKU/location with tenant scope and movement-aware balances where implemented. |
| Net units sold | Sold Units - Returned Units; cancelled units excluded when source data distinguishes them. |
| Sell-through | Net Units Sold / (Opening Available Inventory + Receipts During Period); insufficient evidence suppresses precision. |
| Weeks of cover | Available Inventory / Weighted Average Weekly Net Sales. |
| Weighted weekly sales | Recent 2 weeks 50%, previous 2 weeks 30%, previous 4 weeks 20%. |
| Merchandise age | Receipt date first, then first availability date, purchase date, first sale date, category/source proxy with reduced confidence. |
| Inventory risk/state | Uses availability, weeks of cover, age, cost confidence, and protection flags. |
| Confidence | Missing cost/source/time-window evidence lowers or suppresses confidence. |
| Recovery opportunity/ranking | Transfer is preferred before markdown when receiving-location demand exists. |
| Productivity metrics | Must expose the rule version and source windows used. |
| Markdown eligibility/recommendation | Cost confidence and missing evidence weaken or suppress margin-sensitive markdown claims. |

## Current compatibility notes

- Existing SQL views may use historical field names such as `sell_through_rate_90`. These remain compatibility behavior until a later migration/version explicitly changes them.
- The TypeScript rule registry is a reference implementation and test oracle, not a replacement for RLS-protected SQL materialization.
- UI and Copilot must consume persisted/system-derived results and cite rule/version evidence; they must not recompute authoritative metrics.

## Unsupported precision

If opening available inventory, receipts, returns, stockout bias, promotion windows, store closures, or cost confidence are unavailable, RetailOS must lower confidence or return insufficient-data states rather than fabricate precision.
