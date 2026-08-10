# Aso Collective Phase 0 Demo Dataset

Dataset versions:

- `ASO_PHASE0_DATASET_V1` - original Phase 0 dataset.
- `ASO_INVENTORY_OPERATIONS_V2` - Phase 1 inventory-operations expansion.
- `ASO_MERCHANDISING_PILOT_V3` - Phase 2A merchandising-intelligence expansion.

Reference date: `2026-07-31`

Data classification: synthetic demo data only.

## Purpose

Aso Collective is one coherent deterministic synthetic African fashion retailer for exercising the Phase 0 data and intelligence path. It is not real retailer data and must not be used as proof of recovered commercial value.

The later V2/V3 files extend the same synthetic retailer. They do not replace V1 and do not create a second demo company.

## Organisation

- Display name: Aṣọ Collective
- ASCII-safe identifier: `aso_collective`
- Legal/demo label: Aso Collective Demo Retail Ltd
- Country: Nigeria
- Currency: NGN
- Locale: en-NG
- Timezone: Africa/Lagos
- Industry: fashion apparel, footwear and accessories
- Operating model: private-label and selective multi-brand retailer

## Locations

1. Lagos Island Flagship
2. Lekki Store
3. Abuja Store
4. Ibadan Store
5. Ecommerce Pool

The Ecommerce Pool is modelled as an inventory location only. It does not imply full omnichannel order orchestration.

## Dataset shape

- 5 locations / active selling-location pools.
- 6 brands/collections.
- 60 styles/products.
- 240 style-colour-size SKUs.
- 10 monthly periods of sales and inventory-relevant history.
- 1,200 inventory-position rows.
- 12,000 sales-history rows.

## Source systems simulated

- Local POS export.
- Inventory spreadsheet.
- WooCommerce-style ecommerce product feed.
- Manual adjustment sheet.
- Transfer records.
- Sales history.
- Product master.
- Partial cost data.

## Required messy-data scenarios

The committed `source-records/messy-records.json` fixture includes all required messy-data scenarios: alternate SKU representation, style-colour-size mismatch, duplicate records, invalid location, missing size, inconsistent colour, missing receipt date, missing cost, stale snapshot, negative imported inventory, unrecorded transfer implication, missing return, wrong variant sold, spelling inconsistency, duplicate external identifiers, low-confidence match, human review, rejection, correction-and-approval, and alias reuse.

## Required retail scenarios

The committed `expected-results/retail-scenarios.json` fixture includes all required retail scenarios, including fast sellers, low weeks of cover, seasonal slow movers, aged inventory, transfer-first candidates, markdown candidates, hold-and-monitor, suppressed low-confidence risk, projectisation, campaign brief, and task evidence.

## Fixture layout

```text
data/demo/aso-collective/
  manifest.json
  organisation.json
  locations.json
  catalogue.json
  source-records/
  inventory/
  sales/
  expected-results/
  versions/
    ASO_INVENTORY_OPERATIONS_V2/
    ASO_MERCHANDISING_PILOT_V3/
```

## V2 inventory operations coverage

`ASO_INVENTORY_OPERATIONS_V2` covers Phase 1 behavior with deterministic synthetic scenarios:

- receipt and selling lifecycle;
- fast seller approaching stockout;
- zero/near-zero available inventory;
- overstock and wrong-door stock;
- Lagos to Abuja and Abuja to Ecommerce Pool transfer candidates;
- transfer requested/approved/dispatched/received evidence;
- partial transfer receipt and discrepancy review;
- adjustment and count/recount/closure evidence;
- damaged/quarantined stock;
- imported negative inventory discrepancy;
- returns mismatch, size imbalance, colour imbalance, and healthy balanced inventory.

This is not WMS, purchasing, POS, or omnichannel order management.

## V3 merchandising coverage

`ASO_MERCHANDISING_PILOT_V3` covers Phase 2A merchandising evidence:

- strong/average/weak sell-through;
- stockout, healthy, and overstock weeks-of-cover scenarios;
- newness/core/basic protection;
- aged seasonal and 26+ week inventory;
- high-value risk;
- transfer-before-markdown, ecommerce exposure, controlled markdown, campaign, hold/monitor, and no-recommendation paths;
- cost-confidence cases for verified/imported/estimated/missing cost;
- merchandising recommendation, markdown draft, and merchandising plan evidence.

The validation level remains `INTERIM_DOMAIN_BASELINE`. It is not original consultant confirmation, pilot validation, customer validation, or proof of recovered customer value.

## Golden expected outcomes

`versions/ASO_MERCHANDISING_PILOT_V3/golden-outcomes.json` stores independently derived deterministic outcomes for selected scenarios. The fixture records:

- rule version;
- available quantity;
- net units sold;
- sell-through;
- weighted average weekly net sales;
- weeks of cover;
- merchandise age;
- inventory risk state;
- recovery recommendation;
- planning signal;
- projectisation eligibility.

Tests compare the rule reference implementation with these expected outcomes. Expected recovery remains expected synthetic value, not actual recovered value.

## Commands

```bash
npm run demo:seed
npm run demo:verify
npm run demo:reset
npm run demo:cleanup
```

The commands are deterministic, idempotent, and synthetic-only. They write local ignored seed state under `.tmp/demo/aso-collective` and fail non-zero on expected-count or formula mismatches.

`npm run demo:verify` also checks that the active dataset version chain is present:

```text
ASO_PHASE0_DATASET_V1
→ ASO_INVENTORY_OPERATIONS_V2
→ ASO_MERCHANDISING_PILOT_V3
```
