# M2.12 Domain Review Packet

Status: prepared for external domain review. M2.12 is not accepted.

## Reviewer response options

For each item, respond with one of:

- `CONFIRM`
- `CHANGE`
- `CONFIGURABLE`
- `COUNTRY_SPECIFIC`
- `CATEGORY_SPECIFIC`
- `PILOT_TEST_REQUIRED`
- `REJECT`

## Evidence classification

- Formula verified: deterministic internal formula and fixture tests pass.
- Internally validated: repository tests or hosted checks pass.
- Interim baseline: RetailOS operating-model v0.9 assumption pending external review.
- Not yet validated: original consultant review, real retailer pilot, and customer/commercial outcomes.

Synthetic Aso evidence must not be interpreted as real retailer/customer validation.

## Retail Operating Model v0.9 assumptions requiring review

- Available Inventory = On Hand - Reserved - Quarantined - Damaged - Protected Presentation Qty - Committed Outbound Qty.
- Net Units Sold = Sold Units - Returned Units.
- Net Sell-Through = Net Units Sold / (Opening Available Inventory + Receipts During Period).
- Weeks of Cover = Available Inventory / Weighted Average Weekly Net Sales.
- Merchandise age source priority: receipt date, first availability date, purchase date, first sale date, low-confidence category/source proxy.
- Newness, core basics, exclusive/high-profile products, and recent positive-velocity items should not be casually classified as dead stock.
- Transfer-before-markdown is preferred when another location has demand.
- Missing or low-confidence cost should suppress exact margin or markdown-recovery claims.

## Current thresholds requiring review

- Stockout risk: zero/negative availability or weeks of cover below 2.
- Overstock: weeks of cover above 18.
- Dead-stock risk: age at least 26 weeks and weeks of cover above 12, unless protected by newness/core/exclusive/recent-velocity evidence.
- Weighted weekly net sales default weighting: recent two weeks 50%, previous two weeks 30%, previous four weeks 20%.

## Aso V2 inventory scenarios

Dataset: `ASO_INVENTORY_OPERATIONS_V2`

Representative scenarios:

- normal receipt and selling lifecycle;
- fast-selling item approaching stockout;
- zero/near-zero availability;
- overstock at one location;
- wrong-door stock with Abuja demand and Lagos excess;
- Lagos to Abuja transfer candidate;
- Abuja to Ecommerce Pool transfer candidate;
- transfer requested/approved/dispatch/receipt path;
- partial transfer receipt;
- transfer discrepancy;
- documented adjustment and reversal/idempotency scenario;
- cycle-count variance, recount, and closure;
- damaged/quarantined representation where current schema supports it;
- imported negative inventory discrepancy as reconciliation evidence;
- returns mismatch;
- size and colour imbalance;
- healthy balanced inventory requiring no action.

## Aso V3 merchandising scenarios

Dataset: `ASO_MERCHANDISING_PILOT_V3`

Representative scenarios:

- strong, average, and weak sell-through;
- healthy, stockout-risk, and overstock weeks of cover;
- newness protection;
- core/basic long-tail protection;
- aged seasonal and 26+ week inventory;
- high-value inventory risk;
- transfer-before-markdown recommendation;
- ecommerce exposure opportunity;
- controlled markdown opportunity;
- campaign opportunity;
- hold/monitor and no-recommendation states;
- missing, estimated, imported, and verified cost;
- low-confidence suppression and high-confidence actionable opportunity;
- projectisation, campaign brief, tasks, recommendations, markdown drafts, and merchandising plans where current implementation supports them.

## Golden outcomes requiring review

Source: `data/demo/aso-collective/versions/ASO_MERCHANDISING_PILOT_V3/golden-outcomes.json`

- `golden-transfer-first-lagos-to-abuja`
- `golden-newness-protected`
- `golden-missing-cost-markdown-suppressed`

Review whether the rules, thresholds, and recommended action are commercially appropriate for Nigerian fashion retail before M2.12 can be accepted.

## Known domain assumptions and uncertainties

- Category-specific lifecycle thresholds may differ for footwear, accessories, occasion wear, basics, and premium lines.
- Country/city/store assumptions are synthetic and must not be treated as claims about real Nigerian consumer behavior.
- Cost confidence handling needs retailer validation before margin recovery is presented commercially.
- Return handling is formula-defined, but SQL productivity views currently lack a return-adjusted implementation.
- Current SQL `sell_through_rate_90` is a historical productivity percentage, not the operating-model net sell-through formula.
- Weeks-of-cover and weighted weekly sales are formula/reference validated, but not yet persisted as SQL outputs.

## Questions for reviewer

1. Are the default stockout, overstock, and dead-stock thresholds directionally valid?
2. Which thresholds must vary by category, price tier, season, or country?
3. Should transfer-before-markdown remain the default recovery sequence?
4. What evidence is required before markdown recommendations can be considered pilot-grade?
5. Is the merchandise age source priority commercially defensible?
6. Should missing-cost records be suppressed entirely or converted to non-margin campaign opportunities?
7. Which Aso scenarios are missing for pre-pilot validation?
8. What must be configurable per tenant before broader rollout?
