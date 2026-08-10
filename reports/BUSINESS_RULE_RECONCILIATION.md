# Business Rule Reconciliation

Date: 2026-08-10

## Decision

P1-3 is remediated to an acceptable pre-M2.12 technical baseline. The repository now has an explicit versioned business-rule contract, a machine-readable implementation map, deterministic golden tests, and database parity tests for rules that currently have equivalent SQL implementations.

This does not mark M2.12 accepted. Domain thresholds, category/country variation, and commercial fitness still require an approved reviewer.

## Implemented architecture

- Domain contract: `docs/domain/BUSINESS_RULE_CONTRACT.md`.
- Reference implementation: `src/lib/business-rules/retail-rules.ts`.
- Implementation map: `src/lib/business-rules/rule-registry.ts`.
- Golden expected outcomes: `data/demo/aso-collective/versions/ASO_MERCHANDISING_PILOT_V3/golden-outcomes.json`.
- TypeScript/golden tests: `tests/domain/retail-rule-contract.test.ts`.
- SQL/TypeScript/golden parity and discrepancy tests: `tests/integration/business-rule-database-parity.test.ts`.

## Rule version

`retailos-operating-model-v0.9.0`

## Rules covered

- inventory available quantity;
- inventory position compatibility;
- net units sold;
- sell-through;
- weighted average weekly net sales;
- weeks of cover;
- merchandise age;
- inventory risk/state;
- confidence;
- recovery action/ranking;
- merchandising productivity;
- markdown eligibility/recommendation.

## SQL ↔ TypeScript ↔ golden result

| Rule | Result | Evidence |
| --- | --- | --- |
| `inventory.available_quantity` | SQL = TypeScript for selected Aso-compatible input | `public.current_inventory_balances.available_quantity` equals `calculateAvailableInventory`. |
| `merchandising.net_sell_through` | VERSION_DIFFERENCE / HISTORICAL_COMPATIBILITY | Golden/TypeScript v0.9 net sell-through is `0.0556`; SQL `product_productivity_metrics.sell_through_rate_90` is a historical 90-day productivity percentage (`5.88`) and must not be presented as canonical net sell-through. |
| `sales.net_units_sold` | UNSUPPORTED_INPUT in current SQL productivity view | SQL productivity currently uses positive `sales_facts.quantity`; return-adjusted sales need persisted return evidence before SQL parity is possible. |
| `merchandising.weighted_average_weekly_net_sales` | No equivalent SQL implementation | Reference/golden validated only. |
| `merchandising.weeks_of_cover` | No equivalent SQL implementation | Reference/golden validated only. |
| `inventory.merchandise_age_weeks` | No equivalent SQL output | Database stores first availability evidence but does not expose age calculation. |

## Discrepancies discovered

### SQL compatibility naming/window

Existing Phase 2A SQL exposes 90-day merchandising fields such as `sell_through_rate_90`. The operating model defines canonical sell-through in terms of net units sold, opening available inventory, and receipts. This is classified as `VERSION_DIFFERENCE` / `HISTORICAL_COMPATIBILITY`, not an immediate bug, because current production behavior already depends on the 90-day productivity field and the schema lacks full receipt/opening-window evidence in every path.

Resolution: preserve existing production behavior, add explicit implementation-map classification, add database parity/discrepancy tests, and require any future canonical persisted net sell-through field to be additive and rule-versioned.

### Missing-cost markdown precision

Margin-sensitive markdown recommendations cannot claim precise recovery when cost is missing.

Resolution: golden scenario `golden-missing-cost-markdown-suppressed` expects campaign review rather than direct markdown action.

### Newness dead-stock behavior

Newness and recent positive velocity should not be classified as dead stock merely because of age or generic thresholds.

Resolution: golden scenario `golden-newness-protected` verifies suppression.

## No unsafe rewrites

No production SQL behavior was silently rewritten. No applied migration was modified.
