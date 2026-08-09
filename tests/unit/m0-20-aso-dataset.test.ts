import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const datasetRoot = path.join(root, "data", "demo", "aso-collective");

async function text(relativePath: string) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(path.join(datasetRoot, relativePath), "utf8")) as T;
}

describe("M0.20 Aso Collective dataset", () => {
  it("documents the persistent autonomous continuation command", async () => {
    const agents = await text("AGENTS.md");
    const workflow = await text("harness/AGENT_WORKFLOW.md");
    const nextTask = await text("reports/NEXT_TASK.md");

    for (const source of [agents, workflow, nextTask]) {
      expect(source).toContain("continue autonomously");
    }
    expect(agents).toContain("AUTONOMOUS CONTINUATION COMMAND");
    expect(agents).toContain("persistent repository command");
  });

  it("stores the expected synthetic retailer identity and market defaults", async () => {
    const manifest = await json<{
      dataset_reference_date: string;
      dataset_version: string;
      synthetic_only: boolean;
    }>("manifest.json");
    const organisation = await json<{
      ascii_identifier: string;
      country: string;
      currency: string;
      locale: string;
      timezone: string;
    }>("organisation.json");
    const locations = await json<Array<{ location_type: string; name: string }>>(
      "locations.json",
    );

    expect(manifest).toMatchObject({
      dataset_reference_date: "2026-07-31",
      dataset_version: "ASO_PHASE0_DATASET_V1",
      synthetic_only: true,
    });
    expect(organisation).toMatchObject({
      ascii_identifier: "aso_collective",
      country: "Nigeria",
      currency: "NGN",
      locale: "en-NG",
      timezone: "Africa/Lagos",
    });
    expect(locations).toHaveLength(5);
    expect(locations.map((location) => location.name)).toEqual([
      "Lagos Island Flagship",
      "Lekki Store",
      "Abuja Store",
      "Ibadan Store",
      "Ecommerce Pool",
    ]);
    expect(locations).toContainEqual(
      expect.objectContaining({ location_type: "ecommerce_pool" }),
    );
  });

  it("matches required dataset scale, source systems, scenarios, and expected results", async () => {
    const catalogue = await json<{
      products: unknown[];
      skus: Array<{ currency?: string; price_ngn: number; sku: string }>;
    }>("catalogue.json");
    const inventory = await json<{ records: unknown[] }>("inventory/snapshots.json");
    const sales = await json<{ records: unknown[] }>("sales/sales-history.json");
    const messy = await json<{ records: Array<{ expected_status: string }> }>(
      "source-records/messy-records.json",
    );
    const retailScenarios = await json<{ records: unknown[] }>(
      "expected-results/retail-scenarios.json",
    );
    const expected = await json<{
      canonical_products: number;
      canonical_skus: number;
      formula_samples: {
        net_sell_through: { value: number };
        weeks_of_cover: { value: number };
      };
      raw_record_counts: Record<string, number>;
    }>("expected-results/expected-results.json");

    expect(catalogue.products).toHaveLength(60);
    expect(catalogue.skus).toHaveLength(240);
    expect(inventory.records).toHaveLength(1_200);
    expect(sales.records).toHaveLength(12_000);
    expect(messy.records).toHaveLength(20);
    expect(retailScenarios.records).toHaveLength(25);
    expect(messy.records.filter((record) => record.expected_status === "rejected")).toHaveLength(2);
    expect(messy.records.filter((record) => record.expected_status === "requires_review")).toHaveLength(4);
    expect(expected.canonical_products).toBe(60);
    expect(expected.canonical_skus).toBe(240);
    expect(expected.raw_record_counts).toMatchObject({
      inventory_snapshot: 1_200,
      manual_adjustment: 4,
      messy_source_records: 20,
      product_master: 240,
      sales_history: 12_000,
      transfer_record: 4,
      woocommerce_product: 240,
    });
    expect(expected.formula_samples.net_sell_through.value).toBeGreaterThan(0);
    expect(expected.formula_samples.weeks_of_cover.value).toBeGreaterThan(0);
  });

  it("records the interim operating model limitations", async () => {
    const model = await text("docs/domain/RETAIL_OPERATING_MODEL_V0_9.md");

    expect(model).toContain("Interim operating baseline pending original consultant review");
    expect(model).toContain("LOCKED_PRODUCT_PRINCIPLE");
    expect(model).toContain("DEFAULT_CONFIGURABLE_RULE");
    expect(model).toContain("ORIGINAL_CONSULTANT_REVIEW_REQUIRED");
    expect(model).toContain("REAL_RETAILER_PILOT_VALIDATION_REQUIRED");
    expect(model).toContain("Do not claim expected value as recovered value");
  });
});
