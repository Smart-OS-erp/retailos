import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const versionRoot = path.join(root, "data", "demo", "aso-collective", "versions");

async function json<T>(...segments: string[]): Promise<T> {
  return JSON.parse(await readFile(path.join(versionRoot, ...segments), "utf8")) as T;
}

describe("M2.11 Aso inventory and merchandising dataset expansion", () => {
  it("adds sequential synthetic dataset versions without replacing V1", async () => {
    const v1 = JSON.parse(
      await readFile(path.join(root, "data", "demo", "aso-collective", "manifest.json"), "utf8"),
    ) as { dataset_version: string };
    const v2 = await json<{ dataset_version: string; extends: string; scale: { sku_variants: number; styles: number } }>(
      "ASO_INVENTORY_OPERATIONS_V2",
      "manifest.json",
    );
    const v3 = await json<{ dataset_version: string; extends: string; domain_validation_level: string }>(
      "ASO_MERCHANDISING_PILOT_V3",
      "manifest.json",
    );

    expect(v1.dataset_version).toBe("ASO_PHASE0_DATASET_V1");
    expect(v2).toMatchObject({
      dataset_version: "ASO_INVENTORY_OPERATIONS_V2",
      extends: "ASO_PHASE0_DATASET_V1",
      scale: { sku_variants: 240, styles: 60 },
    });
    expect(v3).toMatchObject({
      dataset_version: "ASO_MERCHANDISING_PILOT_V3",
      extends: "ASO_INVENTORY_OPERATIONS_V2",
      domain_validation_level: "INTERIM_DOMAIN_BASELINE",
    });
  });

  it("covers required Phase 1 inventory operations scenarios", async () => {
    const scenarios = await json<{ records: Array<{ events: string[]; scenario: string }> }>(
      "ASO_INVENTORY_OPERATIONS_V2",
      "inventory-scenarios.json",
    );
    const scenarioText = scenarios.records.map((record) => `${record.scenario} ${record.events.join(" ")}`).join(" ");

    for (const required of [
      "receipt",
      "sale",
      "return",
      "stockout",
      "overstock",
      "transfer_requested",
      "transfer_approved",
      "transfer_dispatched",
      "partial_receipt",
      "discrepancy",
      "stock_count",
      "variance",
      "quarantine",
      "negative_import",
      "size_imbalance",
      "balanced",
    ]) {
      expect(scenarioText).toContain(required);
    }
  });

  it("covers required Phase 2A merchandising scenarios without future-module claims", async () => {
    const scenarios = await json<{ records: Array<{ expected_signal: string; scenario: string }> }>(
      "ASO_MERCHANDISING_PILOT_V3",
      "merchandising-scenarios.json",
    );
    const scenarioText = scenarios.records.map((record) => `${record.scenario} ${record.expected_signal}`).join(" ");

    for (const required of [
      "Strong sell-through",
      "Weak sell-through",
      "Newness protection",
      "Core/basic",
      "26+ week",
      "High-value",
      "Ecommerce exposure",
      "Controlled markdown",
      "Campaign",
      "Missing cost",
      "Estimated cost",
      "Projectised",
      "Markdown draft",
      "Merchandising plan",
    ]) {
      expect(scenarioText).toContain(required);
    }
    expect(scenarioText).not.toContain("forecasting precision");
    expect(scenarioText).not.toContain("purchase order");
  });
});
