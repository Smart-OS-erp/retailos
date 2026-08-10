# M2.11 Acceptance Evidence

Date: 2026-08-10

Decision: `M2_11_ACCEPTED`

## Dataset versions

- `ASO_PHASE0_DATASET_V1` - existing Phase 0 dataset.
- `ASO_INVENTORY_OPERATIONS_V2` - new Phase 1 inventory operations expansion.
- `ASO_MERCHANDISING_PILOT_V3` - new Phase 2A merchandising pilot expansion.

All versions are synthetic only and preserve the same Aso Collective retailer identity.

## Scale

- 5 active selling/location pools.
- 60 styles/products.
- 240 SKU variants.
- 10 months deterministic commercial history.
- 1,200 inventory-position rows in V1 base.
- 12,000 sales-history rows in V1 base.

## Scenario coverage

### Phase 1 inventory operations

Covered by `ASO_INVENTORY_OPERATIONS_V2/inventory-scenarios.json`:

- normal receipt and selling lifecycle;
- fast seller approaching stockout;
- zero available inventory;
- wrong-door overstock;
- Lagos to Abuja and Abuja to Ecommerce Pool transfer candidates;
- transfer requested/approved/dispatched/received path;
- partial transfer receipt and discrepancy;
- inventory adjustment/count variance/recount/closure;
- damaged/quarantined stock;
- imported negative inventory discrepancy;
- returns, size imbalance, colour imbalance, and balanced no-action inventory.

### Phase 2A merchandising

Covered by `ASO_MERCHANDISING_PILOT_V3/merchandising-scenarios.json` and `golden-outcomes.json`:

- strong/average/weak sell-through;
- stockout/healthy/overstock weeks of cover;
- newness and core/basic protection;
- aged seasonal and 26+ week inventory;
- transfer-before-markdown;
- ecommerce exposure, controlled markdown, campaign, hold/monitor, no recommendation;
- missing/estimated/verified cost confidence;
- high-confidence recovery, below-threshold opportunity, projectised opportunity;
- merchandising recommendation, markdown draft, merchandising plan.

## Golden outcomes

`golden-outcomes.json` contains independently derived expected outcomes for selected scenarios:

- `golden-transfer-first-lagos-to-abuja`;
- `golden-newness-protected`;
- `golden-missing-cost-markdown-suppressed`.

Each records rule version, available quantity, net units sold, sell-through, weighted average weekly sales, weeks of cover, merchandise age, risk state, recommendation action, planning signal, and projectisation eligibility.

## Rule consistency

`tests/domain/retail-rule-contract.test.ts` verifies that the TypeScript reference implementation matches golden expected outcomes.

## Safety boundaries

- No real retailer/customer data.
- No original consultant validation claimed.
- No pilot/customer validation claimed.
- No autonomous stock movement, markdown execution, price change, external-system write-back, POS, finance, WMS, purchasing, or wholesale behavior introduced.

## Remaining human gate

M2.12 Retail Domain Validation requires original consultant or approved independent domain-review evidence.
