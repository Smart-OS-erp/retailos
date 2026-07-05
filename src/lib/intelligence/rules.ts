import {
  PHASE_0_RULE_VERSION,
  SALES_COMPARISON_DAYS,
  SALES_WINDOW_DAYS,
  type CalculationContext,
  type UnknownResult,
  unknownResult,
  roundScore,
} from "./types";

const DAY_IN_MS = 86_400_000;

export type InventoryAgeBand = "fresh" | "watch" | "aged" | "dead";

export type InventoryAgeResult =
  | Readonly<{
      status: "known";
      ageDays: number;
      band: InventoryAgeBand;
      ruleVersion: typeof PHASE_0_RULE_VERSION;
      evaluatedAt: string;
      evidence: CalculationContext["evidence"];
      caveats: readonly string[];
    }>
  | UnknownResult;

export function classifyInventoryAge(input: {
  availableSince: string | null;
  context: CalculationContext;
}): InventoryAgeResult {
  if (input.availableSince === null) {
    return unknownResult(input.context, "MISSING_AGE_EVIDENCE", [
      "A trusted receipt or availability date is required.",
    ]);
  }

  const availableSince = Date.parse(input.availableSince);
  const evaluatedAt = Date.parse(input.context.evaluatedAt);

  if (
    !Number.isFinite(availableSince) ||
    !Number.isFinite(evaluatedAt) ||
    availableSince > evaluatedAt
  ) {
    return unknownResult(input.context, "INVALID_INPUT", [
      "The inventory age dates are invalid or conflict.",
    ]);
  }

  const ageDays = Math.floor((evaluatedAt - availableSince) / DAY_IN_MS);
  const band: InventoryAgeBand =
    ageDays <= 60
      ? "fresh"
      : ageDays <= 90
        ? "watch"
        : ageDays <= 180
          ? "aged"
          : "dead";

  return {
    status: "known",
    ageDays,
    band,
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: input.context.evaluatedAt,
    evidence: input.context.evidence,
    caveats: [],
  };
}

export type EligibleSaleObservation = Readonly<{
  occurredAt: string;
  eligibleUnits: number;
}>;

export type SalesWindowResult =
  | Readonly<{
      status: "known";
      windowDays: typeof SALES_WINDOW_DAYS;
      comparisonDays: typeof SALES_COMPARISON_DAYS;
      current30DayUnits: number;
      prior60DayUnits: number;
      prior30DayEquivalentUnits: number;
      changePercent: number | null;
      trend: "growing" | "stable" | "declining" | "new_activity" | "no_sales";
      ruleVersion: typeof PHASE_0_RULE_VERSION;
      evaluatedAt: string;
      evidence: CalculationContext["evidence"];
      caveats: readonly string[];
    }>
  | UnknownResult;

export function analyzeSalesWindow(input: {
  observations: readonly EligibleSaleObservation[];
  coverageDays: number;
  context: CalculationContext;
}): SalesWindowResult {
  if (input.coverageDays < SALES_WINDOW_DAYS) {
    return unknownResult(input.context, "INCOMPLETE_SALES_WINDOW", [
      `A complete trailing ${SALES_WINDOW_DAYS}-day sales window is required.`,
    ]);
  }

  const evaluatedAt = Date.parse(input.context.evaluatedAt);
  if (!Number.isFinite(evaluatedAt)) {
    return unknownResult(input.context, "INVALID_INPUT", [
      "The evaluation date is invalid.",
    ]);
  }

  const windowStart = evaluatedAt - SALES_WINDOW_DAYS * DAY_IN_MS;
  const comparisonStart = evaluatedAt - SALES_COMPARISON_DAYS * DAY_IN_MS;
  let current30DayUnits = 0;
  let prior60DayUnits = 0;

  for (const observation of input.observations) {
    const occurredAt = Date.parse(observation.occurredAt);
    if (
      !Number.isFinite(occurredAt) ||
      !Number.isFinite(observation.eligibleUnits) ||
      observation.eligibleUnits < 0
    ) {
      return unknownResult(input.context, "INVALID_INPUT", [
        "Sales observations must have valid dates and non-negative eligible units.",
      ]);
    }

    if (occurredAt < windowStart || occurredAt >= evaluatedAt) {
      continue;
    }

    if (occurredAt >= comparisonStart) {
      current30DayUnits += observation.eligibleUnits;
    } else {
      prior60DayUnits += observation.eligibleUnits;
    }
  }

  const prior30DayEquivalentUnits = prior60DayUnits / 2;
  const changePercent =
    prior30DayEquivalentUnits === 0
      ? null
      : roundScore(
          ((current30DayUnits - prior30DayEquivalentUnits) /
            prior30DayEquivalentUnits) *
            100,
        );

  let trend: Extract<SalesWindowResult, { status: "known" }>["trend"];
  if (prior30DayEquivalentUnits === 0) {
    trend = current30DayUnits === 0 ? "no_sales" : "new_activity";
  } else if (changePercent !== null && changePercent <= -10) {
    trend = "declining";
  } else if (changePercent !== null && changePercent >= 10) {
    trend = "growing";
  } else {
    trend = "stable";
  }

  return {
    status: "known",
    windowDays: SALES_WINDOW_DAYS,
    comparisonDays: SALES_COMPARISON_DAYS,
    current30DayUnits: roundScore(current30DayUnits),
    prior60DayUnits: roundScore(prior60DayUnits),
    prior30DayEquivalentUnits: roundScore(prior30DayEquivalentUnits),
    changePercent,
    trend,
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: input.context.evaluatedAt,
    evidence: input.context.evidence,
    caveats: [
      "The comparison normalizes the preceding 60 days to a 30-day equivalent.",
    ],
  };
}
