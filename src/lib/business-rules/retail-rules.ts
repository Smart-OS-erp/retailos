export const RETAIL_RULESET_VERSION = "retailos-operating-model-v0.9.0" as const;

export type RuleConfidence = "high" | "medium" | "low" | "insufficient_data";

export type CostConfidence =
  | "VERIFIED_COST"
  | "IMPORTED_COST"
  | "ESTIMATED_COST"
  | "MISSING_COST";

export type PlanningSignal =
  | "campaign_review"
  | "hold_monitor"
  | "markdown_review"
  | "none"
  | "replenishment_watch"
  | "transfer_first";

export type InventoryRiskState =
  | "balanced"
  | "dead_stock_risk"
  | "insufficient_data"
  | "overstock"
  | "stockout_risk";

export type RecommendationAction =
  | "campaign"
  | "ecommerce_exposure"
  | "hold_monitor"
  | "markdown"
  | "none"
  | "transfer";

export type RuleTrace = {
  assumptions: string[];
  inputs: Record<string, number | string | null>;
  ruleId: string;
  ruleVersion: typeof RETAIL_RULESET_VERSION;
};

export type RuleResult<T> = {
  confidence: RuleConfidence;
  missingEvidence: string[];
  trace: RuleTrace;
  value: T;
};

export type AvailableInventoryInput = {
  committedOutboundQuantity?: number;
  damagedQuantity?: number;
  onHandQuantity: number;
  protectedPresentationQuantity?: number;
  quarantinedQuantity?: number;
  reservedQuantity?: number;
};

export type SalesWindowInput = {
  cancelledUnits?: number;
  returnedUnits?: number;
  soldUnits: number;
};

export type SellThroughInput = {
  netUnitsSold: number;
  openingAvailableInventory: number | null;
  receiptsDuringPeriod: number | null;
};

export type WeeklySalesInput = {
  previousFourWeeksNetSales: number | null;
  previousTwoWeeksNetSales: number | null;
  recentTwoWeeksNetSales: number | null;
};

export type MerchandiseAgeInput = {
  categoryProxyAgeWeeks?: number | null;
  firstAvailabilityDate?: string | null;
  firstSaleDate?: string | null;
  purchaseDate?: string | null;
  receiptDate?: string | null;
  referenceDate: string;
};

export type InventoryRiskInput = {
  ageWeeks: number | null;
  availableQuantity: number;
  costConfidence: CostConfidence;
  isCoreBasic?: boolean;
  isExclusiveHighProfile?: boolean;
  isNewness?: boolean;
  recentPositiveVelocity?: boolean;
  weeksOfCover: number | null;
};

function numberOrZero(value: number | undefined): number {
  return value ?? 0;
}

function trace(ruleId: string, inputs: RuleTrace["inputs"], assumptions: string[]): RuleTrace {
  return {
    assumptions,
    inputs,
    ruleId,
    ruleVersion: RETAIL_RULESET_VERSION,
  };
}

export function calculateAvailableInventory(input: AvailableInventoryInput): RuleResult<number> {
  const reserved = numberOrZero(input.reservedQuantity);
  const quarantined = numberOrZero(input.quarantinedQuantity);
  const damaged = numberOrZero(input.damagedQuantity);
  const protectedPresentation = numberOrZero(input.protectedPresentationQuantity);
  const committedOutbound = numberOrZero(input.committedOutboundQuantity);
  const raw =
    input.onHandQuantity -
    reserved -
    quarantined -
    damaged -
    protectedPresentation -
    committedOutbound;

  return {
    confidence: "high",
    missingEvidence: [],
    trace: trace(
      "inventory.available_quantity",
      {
        committedOutboundQuantity: committedOutbound,
        damagedQuantity: damaged,
        onHandQuantity: input.onHandQuantity,
        protectedPresentationQuantity: protectedPresentation,
        quarantinedQuantity: quarantined,
        reservedQuantity: reserved,
      },
      ["Negative imported inventory may be preserved as discrepancy evidence, but normal workflow availability is floored at zero."],
    ),
    value: Math.max(0, raw),
  };
}

export function calculateNetUnitsSold(input: SalesWindowInput): RuleResult<number> {
  const returnedUnits = numberOrZero(input.returnedUnits);
  return {
    confidence: "high",
    missingEvidence: [],
    trace: trace(
      "sales.net_units_sold",
      {
        cancelledUnits: numberOrZero(input.cancelledUnits),
        returnedUnits,
        soldUnits: input.soldUnits,
      },
      ["Cancelled transactions are excluded before this calculation when source data distinguishes them."],
    ),
    value: Math.max(0, input.soldUnits - returnedUnits),
  };
}

export function calculateSellThrough(input: SellThroughInput): RuleResult<number | null> {
  const missingEvidence = [];
  if (input.openingAvailableInventory === null) missingEvidence.push("opening_available_inventory");
  if (input.receiptsDuringPeriod === null) missingEvidence.push("receipts_during_period");
  const denominator =
    input.openingAvailableInventory === null || input.receiptsDuringPeriod === null
      ? null
      : input.openingAvailableInventory + input.receiptsDuringPeriod;

  return {
    confidence: denominator === null || denominator <= 0 ? "insufficient_data" : "medium",
    missingEvidence,
    trace: trace(
      "merchandising.net_sell_through",
      {
        netUnitsSold: input.netUnitsSold,
        openingAvailableInventory: input.openingAvailableInventory,
        receiptsDuringPeriod: input.receiptsDuringPeriod,
      },
      ["Formula follows operating model v0.9; confidence remains medium until receipt/opening data provenance is verified."],
    ),
    value: denominator === null || denominator <= 0 ? null : Number((input.netUnitsSold / denominator).toFixed(4)),
  };
}

export function calculateWeightedAverageWeeklyNetSales(input: WeeklySalesInput): RuleResult<number | null> {
  const missingEvidence = [];
  if (input.recentTwoWeeksNetSales === null) missingEvidence.push("recent_two_weeks_net_sales");
  if (input.previousTwoWeeksNetSales === null) missingEvidence.push("previous_two_weeks_net_sales");
  if (input.previousFourWeeksNetSales === null) missingEvidence.push("previous_four_weeks_net_sales");
  if (missingEvidence.length > 0) {
    return {
      confidence: "insufficient_data",
      missingEvidence,
      trace: trace("merchandising.weighted_average_weekly_net_sales", {}, ["Default weighting is 50/30/20."]),
      value: null,
    };
  }

  const recentWeekly = input.recentTwoWeeksNetSales! / 2;
  const previousTwoWeekly = input.previousTwoWeeksNetSales! / 2;
  const previousFourWeekly = input.previousFourWeeksNetSales! / 4;
  return {
    confidence: "medium",
    missingEvidence: [],
    trace: trace(
      "merchandising.weighted_average_weekly_net_sales",
      {
        previousFourWeeksNetSales: input.previousFourWeeksNetSales,
        previousTwoWeeksNetSales: input.previousTwoWeeksNetSales,
        recentTwoWeeksNetSales: input.recentTwoWeeksNetSales,
      },
      ["Default weighting: recent 2 weeks 50%, previous 2 weeks 30%, previous 4 weeks 20%."],
    ),
    value: Number((recentWeekly * 0.5 + previousTwoWeekly * 0.3 + previousFourWeekly * 0.2).toFixed(4)),
  };
}

export function calculateWeeksOfCover(availableInventory: number, averageWeeklyNetSales: number | null): RuleResult<number | null> {
  return {
    confidence: averageWeeklyNetSales === null || averageWeeklyNetSales <= 0 ? "insufficient_data" : "medium",
    missingEvidence: averageWeeklyNetSales === null ? ["weighted_average_weekly_net_sales"] : [],
    trace: trace(
      "merchandising.weeks_of_cover",
      { availableInventory, averageWeeklyNetSales },
      ["Display caps and stockout bias handling remain tenant-configurable pilot decisions."],
    ),
    value: averageWeeklyNetSales === null || averageWeeklyNetSales <= 0 ? null : Number((availableInventory / averageWeeklyNetSales).toFixed(2)),
  };
}

function weeksBetween(referenceDate: string, sourceDate: string): number {
  const reference = Date.parse(`${referenceDate}T00:00:00.000Z`);
  const source = Date.parse(`${sourceDate}T00:00:00.000Z`);
  return Math.max(0, Math.floor((reference - source) / (1000 * 60 * 60 * 24 * 7)));
}

export function calculateMerchandiseAge(input: MerchandiseAgeInput): RuleResult<number | null> {
  const candidates = [
    ["receipt_date", input.receiptDate],
    ["first_availability_date", input.firstAvailabilityDate],
    ["purchase_date", input.purchaseDate],
    ["first_sale_date", input.firstSaleDate],
  ] as const;
  const selected = candidates.find(([, value]) => value);
  if (selected) {
    return {
      confidence: selected[0] === "receipt_date" ? "high" : "medium",
      missingEvidence: candidates.filter(([key]) => key !== selected[0]).map(([key]) => key),
      trace: trace(
        "inventory.merchandise_age_weeks",
        { referenceDate: input.referenceDate, sourceDate: selected[1]!, sourceType: selected[0] },
        ["Transfers and returns must preserve original merchandise age when lineage is known."],
      ),
      value: weeksBetween(input.referenceDate, selected[1]!),
    };
  }

  if (input.categoryProxyAgeWeeks !== null && input.categoryProxyAgeWeeks !== undefined) {
    return {
      confidence: "low",
      missingEvidence: ["receipt_date", "first_availability_date", "purchase_date", "first_sale_date"],
      trace: trace(
        "inventory.merchandise_age_weeks",
        { categoryProxyAgeWeeks: input.categoryProxyAgeWeeks, referenceDate: input.referenceDate },
        ["Category/source proxy is a low-confidence fallback."],
      ),
      value: input.categoryProxyAgeWeeks,
    };
  }

  return {
    confidence: "insufficient_data",
    missingEvidence: ["receipt_date", "first_availability_date", "purchase_date", "first_sale_date", "category_proxy_age_weeks"],
    trace: trace("inventory.merchandise_age_weeks", { referenceDate: input.referenceDate }, []),
    value: null,
  };
}

export function classifyInventoryRisk(input: InventoryRiskInput): RuleResult<InventoryRiskState> {
  const missingEvidence = [];
  if (input.ageWeeks === null) missingEvidence.push("merchandise_age_weeks");
  if (input.weeksOfCover === null) missingEvidence.push("weeks_of_cover");
  if (missingEvidence.length > 0) {
    return {
      confidence: "insufficient_data",
      missingEvidence,
      trace: trace("inventory.risk_state", {}, ["Missing evidence suppresses fake precision."]),
      value: "insufficient_data",
    };
  }

  const protectedFromDeadStock =
    input.isNewness || input.isCoreBasic || input.isExclusiveHighProfile || input.recentPositiveVelocity;
  let value: InventoryRiskState = "balanced";
  if (input.availableQuantity <= 0 || input.weeksOfCover! < 2) value = "stockout_risk";
  else if (input.weeksOfCover! > 18) value = "overstock";
  if (!protectedFromDeadStock && input.ageWeeks! >= 26 && input.weeksOfCover! > 12) value = "dead_stock_risk";

  return {
    confidence: input.costConfidence === "MISSING_COST" ? "low" : "medium",
    missingEvidence: input.costConfidence === "MISSING_COST" ? ["unit_cost"] : [],
    trace: trace(
      "inventory.risk_state",
      {
        ageWeeks: input.ageWeeks,
        availableQuantity: input.availableQuantity,
        costConfidence: input.costConfidence,
        weeksOfCover: input.weeksOfCover,
      },
      ["Newness, core basics, exclusive/high-profile products, and recent positive velocity are not casually classified as dead stock."],
    ),
    value,
  };
}

export function recommendRecoveryAction(input: InventoryRiskInput & { hasReceivingLocationDemand?: boolean }): RuleResult<RecommendationAction> {
  const risk = classifyInventoryRisk(input);
  if (risk.value === "insufficient_data") {
    return {
      confidence: "insufficient_data",
      missingEvidence: risk.missingEvidence,
      trace: trace("recovery.recommendation_action", risk.trace.inputs, ["Insufficient risk evidence suppresses recommendation."]),
      value: "none",
    };
  }

  let value: RecommendationAction = "hold_monitor";
  if (risk.value === "stockout_risk") value = "none";
  if ((risk.value === "overstock" || risk.value === "dead_stock_risk") && input.hasReceivingLocationDemand) value = "transfer";
  else if (risk.value === "overstock") value = "ecommerce_exposure";
  else if (risk.value === "dead_stock_risk" && input.costConfidence !== "MISSING_COST") value = "markdown";
  else if (risk.value === "dead_stock_risk") value = "campaign";

  return {
    confidence: input.costConfidence === "MISSING_COST" && value === "markdown" ? "low" : risk.confidence,
    missingEvidence: risk.missingEvidence,
    trace: trace(
      "recovery.recommendation_action",
      { ...risk.trace.inputs, hasReceivingLocationDemand: String(Boolean(input.hasReceivingLocationDemand)) },
      ["Preferred recovery sequence starts with transfer before markdown when receiving-location demand exists."],
    ),
    value,
  };
}
