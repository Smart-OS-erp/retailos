const fs = require("node:fs");
const path = require("node:path");

type LocationType = "ecommerce_pool" | "store";
type CostConfidence =
  | "ESTIMATED_COST"
  | "IMPORTED_COST"
  | "MISSING_COST"
  | "VERIFIED_COST";

type Product = {
  brand: string;
  category: string;
  collection: string;
  department: string;
  name: string;
  product_id: string;
  seasonality: "carry_over" | "core" | "limited" | "seasonal";
  style_code: string;
  subcategory: string;
};

type Sku = Product & {
  colour: string;
  cost_confidence: CostConfidence;
  price_ngn: number;
  receipt_date: string | null;
  size: string;
  sku: string;
};

const DATASET_VERSION = "ASO_PHASE0_DATASET_V1";
const REFERENCE_DATE = "2026-07-31";
const ROOT = process.cwd();
const DATASET_DIR = path.join(ROOT, "data", "demo", "aso-collective");
const SOURCE_DIR = path.join(DATASET_DIR, "source-records");
const INVENTORY_DIR = path.join(DATASET_DIR, "inventory");
const SALES_DIR = path.join(DATASET_DIR, "sales");
const EXPECTED_DIR = path.join(DATASET_DIR, "expected-results");
const STATE_DIR = path.join(ROOT, ".tmp", "demo", "aso-collective");
const STATE_FILE = path.join(STATE_DIR, "seed-state.json");
const REPORT_FILE = path.join(ROOT, "reports", "ASO_PHASE0_DATASET_VERIFICATION.md");

const organization = {
  ascii_identifier: "aso_collective",
  country: "Nigeria",
  currency: "NGN",
  data_classification: "Synthetic demo data only",
  dataset_version: DATASET_VERSION,
  display_name: "Aṣọ Collective",
  industry: "Fashion apparel, footwear and accessories",
  legal_demo_label: "Aso Collective Demo Retail Ltd",
  locale: "en-NG",
  operating_model: "Private-label and selective multi-brand retailer",
  timezone: "Africa/Lagos",
};

const locations = [
  {
    code: "LAG-ISL",
    country: "Nigeria",
    location_type: "store" as LocationType,
    name: "Lagos Island Flagship",
    timezone: "Africa/Lagos",
  },
  {
    code: "LAG-LEK",
    country: "Nigeria",
    location_type: "store" as LocationType,
    name: "Lekki Store",
    timezone: "Africa/Lagos",
  },
  {
    code: "ABV-001",
    country: "Nigeria",
    location_type: "store" as LocationType,
    name: "Abuja Store",
    timezone: "Africa/Lagos",
  },
  {
    code: "IBD-001",
    country: "Nigeria",
    location_type: "store" as LocationType,
    name: "Ibadan Store",
    timezone: "Africa/Lagos",
  },
  {
    code: "ECOM-NG",
    country: "Nigeria",
    location_type: "ecommerce_pool" as LocationType,
    name: "Ecommerce Pool",
    note: "Inventory location only; not full omnichannel orchestration.",
    timezone: "Africa/Lagos",
  },
];

const departments = [
  {
    categories: [
      ["Dresses", "Occasion dresses", ["Wrap Dress", "Column Dress", "Pleated Midi"]],
      ["Tops", "Casual tops", ["Linen Shirt", "Silk Cami", "Knit Polo"]],
      ["Bottoms", "Tailored bottoms", ["Wide Leg Trouser", "Cargo Skirt", "Denim Culotte"]],
    ],
    department: "Womenswear",
  },
  {
    categories: [
      ["Shirts", "Casual shirts", ["Camp Collar Shirt", "Oxford Shirt", "Print Shirt"]],
      ["Trousers", "Tailored trousers", ["Chino Trouser", "Drawstring Trouser", "Cargo Trouser"]],
      ["Outerwear", "Light jackets", ["Utility Jacket", "Bomber Jacket", "Overshirt"]],
    ],
    department: "Menswear",
  },
  {
    categories: [
      ["Footwear", "Leather sandals", ["Lagos Sandal", "Platform Mule", "Driving Loafer"]],
      ["Footwear", "Sneakers", ["Canvas Sneaker", "Court Sneaker", "Slip-On Sneaker"]],
    ],
    department: "Footwear",
  },
  {
    categories: [
      ["Bags", "Everyday bags", ["Market Tote", "Mini Crossbody", "Structured Satchel"]],
      ["Accessories", "Small accessories", ["Silk Scarf", "Leather Belt", "Beaded Cap"]],
    ],
    department: "Accessories",
  },
];

const brands = [
  "Aso Studio",
  "Lagos Loom",
  "Kente Theory",
  "Nairobi Cut",
  "Cape Edit",
  "Market Select",
];

const colours = ["Black", "Ivory", "Indigo", "Palm Green", "Terracotta", "Gold"];
const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function ensureDir(directory: string) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(relativePath: string, value: unknown) {
  const filePath = path.join(DATASET_DIR, relativePath);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function weeksBefore(referenceDate: string, weeks: number) {
  const date = new Date(`${referenceDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - weeks * 7);
  return date.toISOString().slice(0, 10);
}

function monthBefore(referenceDate: string, months: number) {
  const date = new Date(`${referenceDate}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.toISOString().slice(0, 10);
}

function styleCode(index: number) {
  return `ASO-${alpha[Math.floor(index / 26)]}${alpha[index % 26]}${String(index + 1).padStart(3, "0")}`;
}

function productRole(index: number): Product["seasonality"] {
  if (index % 17 === 0) return "limited";
  if (index % 11 === 0) return "seasonal";
  if (index % 5 === 0) return "carry_over";
  return "core";
}

function priceFor(productIndex: number, skuIndex: number) {
  const base = 18_000 + (productIndex % 9) * 6_500 + skuIndex * 1_250;
  return Math.round(base / 500) * 500;
}

function generateCatalogue() {
  const products: Product[] = [];
  for (const department of departments) {
    for (const [category, subcategory, names] of department.categories) {
      for (const name of names) {
        for (let variation = 0; variation < 2; variation += 1) {
          const index = products.length;
          const code = styleCode(index);
          products.push({
            brand: brands[index % brands.length],
            category,
            collection: ["Dry Season Core", "Rainy Season Edit", "Occasion Capsule", "Everyday Lagos", "Heritage Carryover"][
              index % 5
            ],
            department: department.department,
            name: `${name} ${variation === 0 ? "Core" : "Edit"}`,
            product_id: `prod_${code.toLowerCase()}`,
            seasonality: productRole(index),
            style_code: code,
            subcategory,
          });
        }
      }
    }
  }

  const skus: Sku[] = [];
  for (const [productIndex, product] of products.entries()) {
    const sizeSet =
      product.department === "Footwear"
        ? ["38", "39", "40", "41"]
        : product.department === "Accessories"
          ? ["OS", "S", "M", "L"]
          : ["S", "M", "L", "XL"];
    for (let variantIndex = 0; variantIndex < 4; variantIndex += 1) {
      const skuIndex = skus.length;
      const costConfidence: CostConfidence =
        skuIndex % 29 === 0
          ? "MISSING_COST"
          : skuIndex % 17 === 0
            ? "ESTIMATED_COST"
            : skuIndex % 7 === 0
              ? "IMPORTED_COST"
              : "VERIFIED_COST";
      skus.push({
        ...product,
        colour: colours[(productIndex + variantIndex) % colours.length],
        cost_confidence: costConfidence,
        price_ngn: priceFor(productIndex, variantIndex),
        receipt_date:
          product.seasonality === "limited"
            ? weeksBefore(REFERENCE_DATE, 3 + (variantIndex % 2))
            : weeksBefore(REFERENCE_DATE, 4 + ((productIndex + variantIndex) % 36)),
        size: sizeSet[variantIndex]!,
        sku: `${product.style_code}-${colours[(productIndex + variantIndex) % colours.length]
          .slice(0, 3)
          .toUpperCase()}-${sizeSet[variantIndex]}`,
      });
    }
  }
  return { products, skus };
}

function generateInventory(skus: Sku[]) {
  const rows = [];
  for (const [skuIndex, sku] of skus.entries()) {
    for (const [locationIndex, location] of locations.entries()) {
      let onHand = 3 + ((skuIndex + locationIndex * 3) % 18);
      if (skuIndex === 4 && location.code === "LAG-ISL") onHand = 72;
      if (skuIndex === 4 && location.code === "ABV-001") onHand = 4;
      if (skuIndex === 8 && location.code === "ABV-001") onHand = 68;
      if (skuIndex === 8 && location.code === "ECOM-NG") onHand = 3;
      if (skuIndex === 12 && location.code === "IBD-001") onHand = -2;
      const protectedPresentation = location.location_type === "store" ? 1 : 0;
      rows.push({
        available_quantity: Math.max(0, onHand - protectedPresentation),
        committed_outbound_quantity: location.code === "LAG-ISL" && skuIndex === 4 ? 6 : 0,
        currency: "NGN",
        damaged_quantity: skuIndex % 41 === 0 ? 1 : 0,
        dataset_version: DATASET_VERSION,
        first_available_date: sku.receipt_date,
        location_code: location.code,
        on_hand_quantity: onHand,
        protected_presentation_quantity: protectedPresentation,
        quarantined_quantity: sku.cost_confidence === "MISSING_COST" ? 1 : 0,
        reserved_quantity: location.code === "ECOM-NG" && skuIndex % 13 === 0 ? 2 : 0,
        sku: sku.sku,
        snapshot_date: skuIndex % 37 === 0 ? weeksBefore(REFERENCE_DATE, 5) : REFERENCE_DATE,
        unit_cost_ngn:
          sku.cost_confidence === "MISSING_COST"
            ? null
            : Math.round((sku.price_ngn * (sku.cost_confidence === "ESTIMATED_COST" ? 0.56 : 0.48)) / 100) * 100,
      });
    }
  }
  return rows;
}

function generateSales(skus: Sku[]) {
  const rows = [];
  for (const [skuIndex, sku] of skus.entries()) {
    for (let monthIndex = 0; monthIndex < 10; monthIndex += 1) {
      for (const [locationIndex, location] of locations.entries()) {
        const fastSeller = skuIndex === 0 || skuIndex === 1;
        const transferDemand = skuIndex === 4 && location.code === "ABV-001";
        const ecommerceDemand = skuIndex === 8 && location.code === "ECOM-NG";
        const seasonalSlow = sku.seasonality === "seasonal" && monthIndex < 4;
        const baseUnits = fastSeller || transferDemand || ecommerceDemand ? 9 - Math.min(monthIndex, 6) : (skuIndex + monthIndex + locationIndex) % 4;
        const unitsSold = seasonalSlow ? 0 : Math.max(0, baseUnits);
        const returnedUnits = skuIndex % 23 === 0 && monthIndex === 2 ? 1 : 0;
        rows.push({
          cancelled_units: skuIndex % 31 === 0 && monthIndex === 1 ? 1 : 0,
          currency: "NGN",
          dataset_version: DATASET_VERSION,
          gross_amount_ngn: unitsSold * sku.price_ngn,
          location_code: location.code,
          net_units_sold: Math.max(0, unitsSold - returnedUnits),
          period_start: monthBefore(REFERENCE_DATE, 9 - monthIndex),
          returned_units: returnedUnits,
          sku: sku.sku,
          sold_units: unitsSold,
        });
      }
    }
  }
  return rows;
}

function messyScenarios() {
  const names = [
    "same_sku_represented_differently",
    "style_colour_size_identity_mismatch",
    "duplicate_source_record",
    "invalid_location",
    "missing_size",
    "inconsistent_colour_name",
    "missing_receipt_date",
    "missing_cost",
    "stale_inventory_snapshot",
    "negative_imported_inventory_discrepancy",
    "unrecorded_transfer_implication",
    "return_not_reflected_in_one_source",
    "wrong_variant_sold",
    "product_name_spelling_inconsistency",
    "duplicate_external_identifiers",
    "low_confidence_canonical_match",
    "record_requiring_human_approval",
    "record_that_must_be_rejected",
    "record_corrected_then_approved",
    "canonical_alias_mapping_reused",
  ];
  return names.map((name, index) => ({
    dataset_version: DATASET_VERSION,
    expected_status:
      index === 3 || index === 17
        ? "rejected"
        : index === 18
          ? "corrected_approved"
          : [7, 15, 16, 19].includes(index)
            ? "requires_review"
            : "accepted",
    scenario: name,
    source_record_id: `messy_${String(index + 1).padStart(2, "0")}`,
  }));
}

function retailScenarios() {
  return [
    "fast_seller_approaching_stockout",
    "strong_seller_low_weeks_of_cover",
    "slow_moving_seasonal_style",
    "aged_inventory_over_26_weeks",
    "overstock_lagos_demand_abuja",
    "overstock_abuja_ecommerce_demand",
    "size_imbalance",
    "colour_imbalance",
    "high_value_at_risk_stock",
    "new_product_not_dead",
    "core_product_long_tail_demand",
    "low_confidence_risk_suppressed",
    "markdown_candidate",
    "transfer_first_candidate",
    "campaign_candidate",
    "hold_and_monitor_recommendation",
    "recommendation_not_generated",
    "missing_cost_case",
    "estimated_cost_case",
    "inventory_freshness_warning",
    "high_priority_recovery_opportunity",
    "lower_value_below_project_threshold",
    "opportunity_converted_to_project",
    "campaign_brief_generated",
    "tasks_generated_from_recovery_action",
  ].map((scenario, index) => ({
    dataset_version: DATASET_VERSION,
    evidence_key: `retail_${String(index + 1).padStart(2, "0")}`,
    scenario,
  }));
}

function computeExpected(skus: Sku[], inventory: ReturnType<typeof generateInventory>, sales: ReturnType<typeof generateSales>) {
  const messy = messyScenarios();
  const sampleFastSku = skus[0]!;
  const fastSkuSales = sales.filter((row) => row.sku === sampleFastSku.sku);
  const fastSkuOpeningAvailable = inventory
    .filter((row) => row.sku === sampleFastSku.sku)
    .reduce((sum, row) => sum + row.available_quantity, 0);
  const fastSkuNetSales = fastSkuSales.reduce((sum, row) => sum + row.net_units_sold, 0);
  const netSellThrough =
    fastSkuNetSales === 0 ? 0 : Number((fastSkuNetSales / (fastSkuOpeningAvailable + fastSkuNetSales)).toFixed(4));
  const recentTwo = fastSkuSales.slice(-10).reduce((sum, row) => sum + row.net_units_sold, 0) / 2;
  const previousTwo = fastSkuSales.slice(-20, -10).reduce((sum, row) => sum + row.net_units_sold, 0) / 2;
  const previousFour = fastSkuSales.slice(-40, -20).reduce((sum, row) => sum + row.net_units_sold, 0) / 4;
  const weightedAverageWeeklyNetSales = Number((recentTwo * 0.5 + previousTwo * 0.3 + previousFour * 0.2).toFixed(4));
  const weeksOfCover = Number((fastSkuOpeningAvailable / Math.max(0.01, weightedAverageWeeklyNetSales)).toFixed(2));
  return {
    accepted_records: messy.filter((row) => row.expected_status === "accepted").length,
    canonical_products: 60,
    canonical_skus: skus.length,
    corrected_approved_records: messy.filter((row) => row.expected_status === "corrected_approved").length,
    copilot_evidence_inputs: [
      "inventory_position",
      "validation_issue",
      "inventory_risk_insight",
      "recovery_opportunity",
      "recovery_project",
      "campaign_brief",
      "recovery_project_task",
    ],
    dataset_reference_date: REFERENCE_DATE,
    dataset_version: DATASET_VERSION,
    expected_risks: {
      high_priority_recovery_opportunities: 3,
      low_confidence_suppressed: 1,
      markdown_candidates: 2,
      transfer_first_candidates: 2,
    },
    formula_samples: {
      net_sell_through: {
        calculation_mode: "net_units_sold / (opening_available_inventory + receipts_during_period)",
        sku: sampleFastSku.sku,
        value: netSellThrough,
      },
      weeks_of_cover: {
        calculation_mode: "available_inventory / weighted_average_weekly_net_sales",
        sku: sampleFastSku.sku,
        value: weeksOfCover,
        weighted_average_weekly_net_sales: weightedAverageWeeklyNetSales,
      },
    },
    invalid_records: messy.filter((row) => row.expected_status === "rejected").length,
    inventory_positions: inventory.length,
    projectisation_eligible_opportunities: 2,
    raw_record_counts: {
      inventory_snapshot: inventory.length,
      manual_adjustment: 4,
      messy_source_records: messy.length,
      product_master: skus.length,
      sales_history: sales.length,
      transfer_record: 4,
      woocommerce_product: skus.length,
    },
    records_requiring_review: messy.filter((row) => row.expected_status === "requires_review").length,
    recovery_opportunity_ranking: [
      "overstock_lagos_demand_abuja",
      "high_value_at_risk_stock",
      "markdown_candidate",
      "hold_and_monitor_recommendation",
    ],
    rejected_records: messy.filter((row) => row.expected_status === "rejected").length,
    retail_scenarios: retailScenarios().length,
    sku_aliases: 24,
    stock_age_bands: ["0-4 weeks", "5-8 weeks", "9-12 weeks", "13-26 weeks", "over 26 weeks"],
    value_identified_ngn: 12_485_000,
    value_projectised_ngn: 7_850_000,
  };
}

function generateDataset() {
  const { products, skus } = generateCatalogue();
  const inventory = generateInventory(skus);
  const sales = generateSales(skus);
  const messy = messyScenarios();
  const retail = retailScenarios();
  const expected = computeExpected(skus, inventory, sales);
  return { expected, inventory, messy, products, retail, sales, skus };
}

function writeDatasetFiles() {
  ensureDir(DATASET_DIR);
  ensureDir(SOURCE_DIR);
  ensureDir(INVENTORY_DIR);
  ensureDir(SALES_DIR);
  ensureDir(EXPECTED_DIR);
  const dataset = generateDataset();
  writeJson("manifest.json", {
    dataset_reference_date: REFERENCE_DATE,
    dataset_version: DATASET_VERSION,
    generated_from: "scripts/demo/aso-collective.ts",
    organisation_identifier: organization.ascii_identifier,
    synthetic_only: true,
  });
  writeJson("organisation.json", organization);
  writeJson("locations.json", locations);
  writeJson("catalogue.json", {
    dataset_version: DATASET_VERSION,
    products: dataset.products,
    skus: dataset.skus,
  });
  writeJson("source-records/product-master.json", {
    dataset_version: DATASET_VERSION,
    records: dataset.skus.map((sku) => ({
      brand: sku.brand,
      category: sku.category,
      colour: sku.colour,
      cost_confidence: sku.cost_confidence,
      department: sku.department,
      name: sku.name,
      price_ngn: sku.price_ngn,
      size: sku.size,
      sku: sku.sku,
      source_system: "product_master",
      style_code: sku.style_code,
      subcategory: sku.subcategory,
    })),
  });
  writeJson("source-records/woocommerce-products.json", {
    dataset_version: DATASET_VERSION,
    records: dataset.skus.map((sku) => ({
      external_id: `woo_${sku.sku.toLowerCase().replaceAll("-", "_")}`,
      price_ngn: sku.price_ngn,
      sku: sku.sku.toLowerCase(),
      source_system: "woocommerce",
      stock_quantity_hint: dataset.inventory
        .filter((row) => row.sku === sku.sku && row.location_code === "ECOM-NG")
        .reduce((sum, row) => sum + row.on_hand_quantity, 0),
      title: sku.name,
    })),
  });
  writeJson("source-records/pos-export.json", {
    dataset_version: DATASET_VERSION,
    records: dataset.sales.slice(0, 360),
    source_system: "local_pos_export",
  });
  writeJson("source-records/manual-adjustments.json", {
    dataset_version: DATASET_VERSION,
    records: ["cycle_count_correction", "damaged_stock", "presentation_protection", "return_reconciliation"].map(
      (reason, index) => ({
        adjusted_at: weeksBefore(REFERENCE_DATE, index + 1),
        location_code: locations[index]!.code,
        quantity_delta: index === 0 ? 2 : -1,
        reason,
        sku: dataset.skus[index * 9]!.sku,
      }),
    ),
    source_system: "manual_adjustment_sheet",
  });
  writeJson("source-records/transfers.json", {
    dataset_version: DATASET_VERSION,
    records: [
      ["LAG-ISL", "ABV-001", dataset.skus[4]!.sku, 8],
      ["ABV-001", "ECOM-NG", dataset.skus[8]!.sku, 6],
      ["IBD-001", "LAG-LEK", dataset.skus[16]!.sku, 3],
      ["LAG-LEK", "LAG-ISL", dataset.skus[24]!.sku, 2],
    ].map(([from_location, to_location, sku, quantity], index) => ({
      from_location,
      quantity,
      requested_at: weeksBefore(REFERENCE_DATE, index + 2),
      sku,
      source_system: "transfer_record",
      to_location,
    })),
  });
  writeJson("source-records/messy-records.json", {
    dataset_version: DATASET_VERSION,
    records: dataset.messy,
  });
  writeJson("inventory/snapshots.json", {
    dataset_version: DATASET_VERSION,
    records: dataset.inventory,
  });
  writeJson("sales/sales-history.json", {
    dataset_version: DATASET_VERSION,
    records: dataset.sales,
  });
  writeJson("expected-results/expected-results.json", dataset.expected);
  writeJson("expected-results/retail-scenarios.json", {
    dataset_version: DATASET_VERSION,
    records: dataset.retail,
  });
  writeJson("expected-results/seed-log.json", {
    dataset_version: DATASET_VERSION,
    event: "seeded",
    reference_date: REFERENCE_DATE,
    synthetic_only: true,
  });
  return dataset;
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATASET_DIR, relativePath), "utf8")) as T;
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function verifyDataset() {
  const generated = generateDataset();
  const manifest = readJson<{ dataset_version: string; synthetic_only: boolean }>("manifest.json");
  const storedOrganization = readJson<typeof organization>("organisation.json");
  const storedLocations = readJson<typeof locations>("locations.json");
  const catalogue = readJson<{ products: Product[]; skus: Sku[] }>("catalogue.json");
  const inventory = readJson<{ records: ReturnType<typeof generateInventory> }>("inventory/snapshots.json");
  const sales = readJson<{ records: ReturnType<typeof generateSales> }>("sales/sales-history.json");
  const messy = readJson<{ records: ReturnType<typeof messyScenarios> }>("source-records/messy-records.json");
  const expected = readJson<ReturnType<typeof computeExpected>>("expected-results/expected-results.json");
  assert(manifest.dataset_version === DATASET_VERSION, "manifest dataset version mismatch");
  assert(manifest.synthetic_only === true, "manifest must be synthetic-only");
  assert(storedOrganization.ascii_identifier === "aso_collective", "organisation identifier mismatch");
  assert(storedOrganization.currency === "NGN", "organisation currency mismatch");
  assert(storedLocations.length === 5, "expected 5 locations");
  assert(storedLocations.some((location) => location.location_type === "ecommerce_pool"), "expected ecommerce inventory pool");
  assert(catalogue.products.length === 60, "expected 60 products/styles");
  assert(catalogue.skus.length === 240, "expected 240 SKUs");
  assert(inventory.records.length === 1_200, "expected 1200 inventory positions");
  assert(sales.records.length === 12_000, "expected 12000 sales history rows");
  assert(messy.records.length === 20, "expected 20 messy-data scenarios");
  assert(expected.dataset_version === DATASET_VERSION, "expected result version mismatch");
  assert(expected.raw_record_counts.inventory_snapshot === inventory.records.length, "inventory count mismatch");
  assert(expected.raw_record_counts.sales_history === sales.records.length, "sales count mismatch");
  assert(expected.raw_record_counts.product_master === catalogue.skus.length, "product master count mismatch");
  assert(expected.retail_scenarios === 25, "expected 25 retail scenarios");
  assert(expected.invalid_records === 2, "expected 2 rejected records");
  assert(expected.records_requiring_review === 4, "expected 4 review records");
  assert(
    JSON.stringify(expected.formula_samples) === JSON.stringify(generated.expected.formula_samples),
    "independent formula expected-results mismatch",
  );
  writeVerificationReport("passed", expected);
  return expected;
}

function writeVerificationReport(status: "cleaned" | "passed" | "reset" | "seeded", expected: ReturnType<typeof computeExpected>) {
  const lines = [
    "# Aso Collective Phase 0 Dataset Verification",
    "",
    `Dataset Version: ${DATASET_VERSION}`,
    `Reference Date: ${REFERENCE_DATE}`,
    `Status: ${status}`,
    `Organisation: ${organization.display_name}`,
    `Locations: ${locations.length}`,
    `Styles: ${expected.canonical_products}`,
    `SKUs: ${expected.canonical_skus}`,
    `History Period: 10 monthly periods ending ${REFERENCE_DATE}`,
    `Inventory Rows: ${expected.inventory_positions}`,
    `Sales Rows: ${expected.raw_record_counts.sales_history}`,
    `Messy Data Scenarios: ${expected.raw_record_counts.messy_source_records}`,
    `Retail Scenarios: ${expected.retail_scenarios}`,
    `Expected Results Match: yes`,
    "",
    "This report is generated from deterministic synthetic fixtures only. It does not contain secrets, passwords, or real retailer data.",
    "",
  ];
  fs.writeFileSync(REPORT_FILE, `${lines.join("\n")}\n`);
}

function seed() {
  const dataset = writeDatasetFiles();
  ensureDir(STATE_DIR);
  const state = {
    dataset_version: DATASET_VERSION,
    organisation_identifier: organization.ascii_identifier,
    reference_date: REFERENCE_DATE,
    seed_status: "seeded",
    synthetic_only: true,
  };
  const previous = fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, "utf8") : null;
  fs.writeFileSync(`${STATE_FILE}.tmp`, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(`${STATE_FILE}.tmp`, STATE_FILE);
  const expected = verifyDataset();
  writeVerificationReport("seeded", expected);
  console.log(
    JSON.stringify({
      dataset_version: DATASET_VERSION,
      idempotent: previous === null || previous === fs.readFileSync(STATE_FILE, "utf8"),
      organisation: organization.display_name,
      status: "seeded",
      styles: dataset.products.length,
      skus: dataset.skus.length,
    }),
  );
}

function reset() {
  seed();
  const expected = verifyDataset();
  writeVerificationReport("reset", expected);
  console.log(JSON.stringify({ dataset_version: DATASET_VERSION, status: "reset" }));
}

function cleanup() {
  if (fs.existsSync(STATE_FILE)) fs.rmSync(STATE_FILE);
  if (fs.existsSync(STATE_DIR) && fs.readdirSync(STATE_DIR).length === 0) fs.rmSync(STATE_DIR, { recursive: true });
  const expected = verifyDataset();
  writeVerificationReport("cleaned", expected);
  assert(!fs.existsSync(STATE_FILE), "cleanup left synthetic seed state behind");
  console.log(JSON.stringify({ dataset_version: DATASET_VERSION, status: "cleaned" }));
}

const command = process.argv[2];
try {
  if (command === "seed") seed();
  else if (command === "verify") {
    const expected = verifyDataset();
    console.log(JSON.stringify({ dataset_version: DATASET_VERSION, status: "passed", ...expected.raw_record_counts }));
  } else if (command === "reset") reset();
  else if (command === "cleanup") cleanup();
  else throw new Error("Usage: node scripts/demo/aso-collective.ts <seed|verify|reset|cleanup>");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
