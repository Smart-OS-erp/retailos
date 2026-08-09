# RetailOS African Fashion Retail Operating Model v0.9

Interim operating baseline pending original consultant review and real retailer pilot validation

## Status

This document records the interim African fashion retail operating baseline accepted for implementation in RetailOS Phase 0 evidence work. It does not claim approval from the originally appointed consultant. It is suitable for deterministic engineering, test fixtures, and synthetic demo data; it is not proof of commercial fit.

Decision classifications used below:

- `LOCKED_PRODUCT_PRINCIPLE`
- `DEFAULT_CONFIGURABLE_RULE`
- `INTERIM_DOMAIN_BASELINE`
- `INTERNAL_FORMULA_VALIDATION_REQUIRED`
- `ORIGINAL_CONSULTANT_REVIEW_REQUIRED`
- `REAL_RETAILER_PILOT_VALIDATION_REQUIRED`
- `DEFERRED_TO_LATER_PHASE`

## Interim consultant assessment and owner interpretation

The supplied interim Head African Retail Consultant assessment is interpreted as: RetailOS should begin with mid-tier African fashion retailers where fragmented stock data, store movement, aging stock, and merchandising action gaps create measurable trapped value. The repository owner accepted the product interpretation that inventory recovery remains the wedge, with intelligence layered over existing POS, ecommerce, and spreadsheet workflows before system replacement.

Agreed corrections:

- Phase 0 must remain inventory-recovery-led, not a generic ERP or dashboard.
- Phase 0.5 integration work is historical Phase 0 integration/data-foundation work, not a separate commercial phase.
- Synthetic data can validate calculations and journeys, but cannot be presented as recovered customer value.
- Human approval remains required before stock movements, material financial actions, markdown execution, or external-system write-back.

## Locked product principles

| Rule | Classification |
| --- | --- |
| Initial market is mid-tier African fashion apparel, footwear, and accessories retailers. | `LOCKED_PRODUCT_PRINCIPLE` |
| Technical target range is approximately 5-40 locations. | `LOCKED_PRODUCT_PRINCIPLE` |
| Initial ICP is approximately 8-25 stores, meaningful inter-store movement, enough data history to analyse, and no fully trusted enterprise planning platform. | `LOCKED_PRODUCT_PRINCIPLE` |
| Primary operating references are Nigeria and South Africa. | `LOCKED_PRODUCT_PRINCIPLE` |
| Compatibility markets are Kenya and Ghana. | `LOCKED_PRODUCT_PRINCIPLE` |
| Initial product wedge is inventory recovery. | `LOCKED_PRODUCT_PRINCIPLE` |
| Initial commercial value is recovering capital tied in aging or misallocated stock while protecting margin. | `LOCKED_PRODUCT_PRINCIPLE` |
| Adoption model is intelligence layered over existing POS, ecommerce, and spreadsheets before full system replacement. | `LOCKED_PRODUCT_PRINCIPLE` |
| Minimum useful data is SKU or style-colour-size identity, location, current quantity, and at least 8-12 weeks of sales. | `LOCKED_PRODUCT_PRINCIPLE` |
| Primary analytical grain is SKU-location, rolled up to style, category, location, and organisation. | `LOCKED_PRODUCT_PRINCIPLE` |
| Preferred recovery sequence is transfer, ecommerce exposure, campaign/visual merchandising, bundle, controlled markdown, promotional use, supplier return, liquidation, write-off, then hold and monitor. | `LOCKED_PRODUCT_PRINCIPLE` |
| Current product stage never auto-executes stock movements or material financial actions. | `LOCKED_PRODUCT_PRINCIPLE` |
| Core terminology includes Location, Recovery Opportunity, Recovery Project, Attention Queue, On Hand, Available, In Transit, and At Risk. | `LOCKED_PRODUCT_PRINCIPLE` |
| Pilot success requires measurable recovered value plus repeated owner and merchandising usage. | `LOCKED_PRODUCT_PRINCIPLE` |
| Full RetailOS end goal remains merchandise planning, purchasing, supplier management, store operations, WMS, omnichannel, POS replacement, finance/profitability, wholesale, intelligent control plane, and platform ecosystem. | `DEFERRED_TO_LATER_PHASE` |

## Canonical inventory definitions

`On Hand` = physically recorded inventory position. `LOCKED_PRODUCT_PRINCIPLE`

`Available` = On Hand - Reserved - Quarantined - Damaged - Protected Presentation Quantity - Committed Outbound Quantity. `LOCKED_PRODUCT_PRINCIPLE`

Normal workflows must not create negative available inventory. Imported negative inventory may be preserved as a source discrepancy and flagged for reconciliation. `INTERIM_DOMAIN_BASELINE`

## Canonical inventory age

Use receipt date where available. Fallback order: receipt date, first availability date, purchase date, first sale date, then category/source proxy with reduced confidence. `DEFAULT_CONFIGURABLE_RULE`

Transfers retain original merchandise age. Customer returns retain original merchandise age where lineage is known. A return must not make old inventory appear new. `LOCKED_PRODUCT_PRINCIPLE`

Default aging bands are configurable: 0-4 weeks, 5-8 weeks, 9-12 weeks, 13-26 weeks, and over 26 weeks. `DEFAULT_CONFIGURABLE_RULE`

## Canonical sell-through default

Net Sell-Through = Net Units Sold / (Opening Available Inventory + Receipts During Period). `INTERNAL_FORMULA_VALIDATION_REQUIRED`

Net Units Sold = Sold Units - Returned Units. Cancelled transactions are excluded. The metric must expose date range, calculation mode, returns treatment, confidence, and last calculated time. Alternative modes may exist but must be explicit and versioned. `DEFAULT_CONFIGURABLE_RULE`

## Canonical weeks-of-cover default

Weeks of Cover = Available Inventory / Weighted Average Weekly Net Sales. `INTERNAL_FORMULA_VALIDATION_REQUIRED`

Default weighting: most recent 2 weeks 50%, previous 2 weeks 30%, previous 4 weeks 20%. The weighting is configurable. The metric must document zero-sales handling, stockout observation bias, promotion handling, missing weeks, store closures, category proxies, confidence suppression, and display caps. `DEFAULT_CONFIGURABLE_RULE`

## Value terminology

- Value Identified = potential value associated with an observed risk or opportunity. `LOCKED_PRODUCT_PRINCIPLE`
- Value Projectised = value formally approved into a recovery project. `LOCKED_PRODUCT_PRINCIPLE`
- Expected Recovery = estimated result before execution. `LOCKED_PRODUCT_PRINCIPLE`
- Actual Recovery = measured outcome after action. `LOCKED_PRODUCT_PRINCIPLE`

Do not claim expected value as recovered value. `LOCKED_PRODUCT_PRINCIPLE`

## Cost confidence

Supported cost-confidence levels: `VERIFIED_COST`, `IMPORTED_COST`, `ESTIMATED_COST`, and `MISSING_COST`. Margin-based recommendations must be suppressed, weakened, or clearly qualified when cost confidence is insufficient. `INTERIM_DOMAIN_BASELINE`

## Tenant-configurable rules

- Aging thresholds.
- Weeks-of-cover weighting.
- Minimum projectisation value threshold.
- Recovery-action priority after the locked preferred sequence.
- Protected presentation quantity.
- Store closure calendars.
- Promotion exclusion windows.
- Category proxy mappings.

These are `DEFAULT_CONFIGURABLE_RULE` items pending real retailer pilot calibration.

## Review and validation register

Original consultant review required:

- Recovery sequence ordering for South Africa, Kenya, and Ghana.
- Category-specific aging thresholds.
- Supplier return and liquidation language.
- Whether ecommerce exposure should precede campaign/visual merchandising for all tenant types.

Real retailer pilot validation required:

- Whether 8-12 weeks of sales is enough for reliable initial value.
- Pilot owner and merchandising usage cadence.
- Projectisation threshold and expected recovery assumptions.
- Weeks-of-cover weighting and display caps.
- Impact of intermittent stockouts, closures, and incomplete returns.

Domain limitations:

- Interim consultant assessment is not the original consultant's confirmation.
- Internal formula agreement is not customer validation.
- Deterministic test results are not proof of commercial adoption.
- Synthetic pilot results are not actual recovered customer value.
