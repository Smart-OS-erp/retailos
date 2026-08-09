# Aso Collective Phase 0 Demo Dataset

Dataset version: `ASO_PHASE0_DATASET_V1`

Reference date: `2026-07-31`

Data classification: synthetic demo data only.

## Purpose

Aso Collective is one coherent deterministic synthetic African fashion retailer for exercising the Phase 0 data and intelligence path. It is not real retailer data and must not be used as proof of recovered commercial value.

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

- 5 locations.
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
```

## Commands

```bash
npm run demo:seed
npm run demo:verify
npm run demo:reset
npm run demo:cleanup
```

The commands are deterministic, idempotent, and synthetic-only. They write local ignored seed state under `.tmp/demo/aso-collective` and fail non-zero on expected-count or formula mismatches.
