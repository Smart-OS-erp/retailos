import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  RETAIL_RULESET_VERSION,
  calculateAvailableInventory,
  calculateMerchandiseAge,
  calculateNetUnitsSold,
  calculateSellThrough,
  calculateWeeksOfCover,
  calculateWeightedAverageWeeklyNetSales,
  classifyInventoryRisk,
  recommendRecoveryAction,
} from "@/lib/business-rules";

const root = process.cwd();
const goldenPath = path.join(
  root,
  "data",
  "demo",
  "aso-collective",
  "versions",
  "ASO_MERCHANDISING_PILOT_V3",
  "golden-outcomes.json",
);

type GoldenOutcome = {
  available_quantity: number;
  cost_confidence: "ESTIMATED_COST" | "IMPORTED_COST" | "MISSING_COST" | "VERIFIED_COST";
  expected_value_ngn: number;
  has_receiving_location_demand: boolean;
  id: string;
  inventory_risk_state: "balanced" | "dead_stock_risk" | "insufficient_data" | "overstock" | "stockout_risk";
  is_core_basic: boolean;
  is_newness: boolean;
  location_code: string;
  merchandise_age_weeks: number;
  net_units_sold: number;
  opening_available_inventory: number;
  planning_signal: string;
  previous_four_weeks_net_sales: number;
  previous_two_weeks_net_sales: number;
  projectisation_eligible: boolean;
  receipt_date: string;
  receipts_during_period: number;
  recent_positive_velocity: boolean;
  recent_two_weeks_net_sales: number;
  recommendation_action: "campaign" | "ecommerce_exposure" | "hold_monitor" | "markdown" | "none" | "transfer";
  returned_units: number;
  sell_through: number;
  sku: string;
  sold_units: number;
  weeks_of_cover: number;
  weighted_average_weekly_net_sales: number;
};

async function goldenOutcomes() {
  const parsed = JSON.parse(await readFile(goldenPath, "utf8")) as {
    dataset_version: string;
    records: GoldenOutcome[];
    rule_version: string;
    synthetic_only: boolean;
  };
  return parsed;
}

describe("RetailOS rule contract", () => {
  it("records the current ruleset version used by golden fixtures", async () => {
    const golden = await goldenOutcomes();

    expect(golden.dataset_version).toBe("ASO_MERCHANDISING_PILOT_V3");
    expect(golden.synthetic_only).toBe(true);
    expect(golden.rule_version).toBe(RETAIL_RULESET_VERSION);
  });

  it("keeps golden merchandising outcomes independently derivable from rule inputs", async () => {
    const golden = await goldenOutcomes();

    for (const outcome of golden.records) {
      const netUnitsSold = calculateNetUnitsSold({
        returnedUnits: outcome.returned_units,
        soldUnits: outcome.sold_units,
      });
      expect(netUnitsSold.value).toBe(outcome.net_units_sold);

      const sellThrough = calculateSellThrough({
        netUnitsSold: netUnitsSold.value,
        openingAvailableInventory: outcome.opening_available_inventory,
        receiptsDuringPeriod: outcome.receipts_during_period,
      });
      expect(sellThrough.value).toBe(outcome.sell_through);

      const averageWeeklySales = calculateWeightedAverageWeeklyNetSales({
        previousFourWeeksNetSales: outcome.previous_four_weeks_net_sales,
        previousTwoWeeksNetSales: outcome.previous_two_weeks_net_sales,
        recentTwoWeeksNetSales: outcome.recent_two_weeks_net_sales,
      });
      expect(averageWeeklySales.value).toBe(outcome.weighted_average_weekly_net_sales);

      const weeksOfCover = calculateWeeksOfCover(outcome.available_quantity, averageWeeklySales.value);
      expect(weeksOfCover.value).toBe(outcome.weeks_of_cover);

      const age = calculateMerchandiseAge({
        receiptDate: outcome.receipt_date,
        referenceDate: "2026-07-31",
      });
      expect(age.value).toBe(outcome.merchandise_age_weeks);

      const risk = classifyInventoryRisk({
        ageWeeks: age.value,
        availableQuantity: outcome.available_quantity,
        costConfidence: outcome.cost_confidence,
        isCoreBasic: outcome.is_core_basic,
        isNewness: outcome.is_newness,
        recentPositiveVelocity: outcome.recent_positive_velocity,
        weeksOfCover: weeksOfCover.value,
      });
      expect(risk.value).toBe(outcome.inventory_risk_state);

      const recommendation = recommendRecoveryAction({
        ageWeeks: age.value,
        availableQuantity: outcome.available_quantity,
        costConfidence: outcome.cost_confidence,
        hasReceivingLocationDemand: outcome.has_receiving_location_demand,
        isCoreBasic: outcome.is_core_basic,
        isNewness: outcome.is_newness,
        recentPositiveVelocity: outcome.recent_positive_velocity,
        weeksOfCover: weeksOfCover.value,
      });
      expect(recommendation.value).toBe(outcome.recommendation_action);
      expect(recommendation.trace.ruleVersion).toBe(RETAIL_RULESET_VERSION);
    }
  });

  it("implements operating-model availability formula without fake negative workflow inventory", () => {
    const available = calculateAvailableInventory({
      committedOutboundQuantity: 2,
      damagedQuantity: 1,
      onHandQuantity: 10,
      protectedPresentationQuantity: 1,
      quarantinedQuantity: 1,
      reservedQuantity: 3,
    });

    expect(available.value).toBe(2);
    expect(available.trace.ruleId).toBe("inventory.available_quantity");

    const negative = calculateAvailableInventory({
      onHandQuantity: -2,
      protectedPresentationQuantity: 1,
    });
    expect(negative.value).toBe(0);
    expect(negative.trace.assumptions.join(" ")).toContain("floored at zero");
  });

  it("suppresses unsupported sell-through precision when opening or receipt evidence is missing", () => {
    const result = calculateSellThrough({
      netUnitsSold: 10,
      openingAvailableInventory: null,
      receiptsDuringPeriod: 5,
    });

    expect(result.value).toBeNull();
    expect(result.confidence).toBe("insufficient_data");
    expect(result.missingEvidence).toContain("opening_available_inventory");
  });
});
