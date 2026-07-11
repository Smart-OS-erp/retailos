import {
  PHASE_0_RULE_VERSION,
  type CalculationContext,
  type SuppressedResult,
  type UnknownResult,
  mergeEvidence,
  roundScore,
  suppressedResult,
  unknownResult,
} from "./types";

export type InventoryValuationResult =
  | Readonly<{
      status: "known";
      quantity: number;
      approvedUnitCost: number;
      currency: string;
      value: number;
      ruleVersion: typeof PHASE_0_RULE_VERSION;
      evaluatedAt: string;
      evidence: CalculationContext["evidence"];
      caveats: readonly string[];
    }>
  | SuppressedResult
  | UnknownResult;

export function calculateInventoryValue(input: {
  quantity: number;
  unitCost: number | null;
  costApproved: boolean;
  currency: string | null;
  context: CalculationContext;
}): InventoryValuationResult {
  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    return unknownResult(input.context, "INVALID_INPUT", [
      "On-hand quantity must be a non-negative number.",
    ]);
  }

  if (
    !input.costApproved ||
    input.unitCost === null ||
    !Number.isFinite(input.unitCost) ||
    input.unitCost < 0
  ) {
    return suppressedResult(input.context, "MISSING_APPROVED_COST", [
      "Valuation requires an approved, non-negative unit cost.",
    ]);
  }

  const currency = input.currency?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{3}$/.test(currency)) {
    return suppressedResult(input.context, "MISSING_CURRENCY", [
      "Valuation requires an ISO 4217 currency code.",
    ]);
  }

  return {
    status: "known",
    quantity: input.quantity,
    approvedUnitCost: input.unitCost,
    currency,
    value: roundScore(input.quantity * input.unitCost),
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: input.context.evaluatedAt,
    evidence: input.context.evidence,
    caveats: [],
  };
}

export type ProjectisedValueResult =
  | Readonly<{
      status: "known";
      currency: string;
      value: number;
      itemCount: number;
      ruleVersion: typeof PHASE_0_RULE_VERSION;
      evaluatedAt: string;
      evidence: CalculationContext["evidence"];
      caveats: readonly string[];
    }>
  | Readonly<{
      status: "not_aggregated";
      reason: "MULTIPLE_CURRENCIES_NO_FX";
      totalsByCurrency: Readonly<Record<string, number>>;
      itemCount: number;
      ruleVersion: typeof PHASE_0_RULE_VERSION;
      evaluatedAt: string;
      evidence: CalculationContext["evidence"];
      caveats: readonly string[];
    }>
  | SuppressedResult
  | UnknownResult;

export function calculateProjectisedValue(
  valuations: readonly InventoryValuationResult[],
  context: CalculationContext,
): ProjectisedValueResult {
  if (valuations.length === 0) {
    return unknownResult(context, "NO_PROJECT_ITEMS", [
      "At least one valued project item is required.",
    ]);
  }

  const unavailable = valuations.find((valuation) => valuation.status !== "known");
  if (unavailable) {
    return suppressedResult(
      {
        ...context,
        evidence: mergeEvidence(context.evidence, unavailable.evidence),
      },
      "DEPENDENCY_SUPPRESSED",
      ["Projectised value is suppressed because at least one item is unvalued."],
    );
  }

  const known = valuations.filter(
    (valuation): valuation is Extract<InventoryValuationResult, { status: "known" }> =>
      valuation.status === "known",
  );
  const totals = new Map<string, number>();
  for (const valuation of known) {
    totals.set(
      valuation.currency,
      roundScore((totals.get(valuation.currency) ?? 0) + valuation.value),
    );
  }

  const evidence = mergeEvidence(
    context.evidence,
    ...known.map((valuation) => valuation.evidence),
  );

  if (totals.size > 1) {
    return {
      status: "not_aggregated",
      reason: "MULTIPLE_CURRENCIES_NO_FX",
      totalsByCurrency: Object.fromEntries([...totals.entries()].sort()),
      itemCount: known.length,
      ruleVersion: PHASE_0_RULE_VERSION,
      evaluatedAt: context.evaluatedAt,
      evidence,
      caveats: [
        "Phase 0 does not convert currencies or produce a cross-currency total.",
      ],
    };
  }

  const total = totals.entries().next().value as [string, number];
  return {
    status: "known",
    currency: total[0],
    value: total[1],
    itemCount: known.length,
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: context.evaluatedAt,
    evidence,
    caveats: [],
  };
}
