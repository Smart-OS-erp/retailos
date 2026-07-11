export const PHASE_0_RULE_VERSION = "retailos.phase0.inventory-recovery.v1";
export const SALES_WINDOW_DAYS = 90;
export const SALES_COMPARISON_DAYS = 30;
export const CONFIDENCE_SUPPRESSION_THRESHOLD = 60;

export type EvidenceReference = Readonly<{
  sourceType: string;
  recordId: string;
  observedAt: string;
}>;

export type CalculationContext = Readonly<{
  evaluatedAt: string;
  evidence: readonly EvidenceReference[];
}>;

export type UnknownResult = Readonly<{
  status: "unknown";
  reason:
    | "INVALID_INPUT"
    | "MISSING_AGE_EVIDENCE"
    | "INCOMPLETE_SALES_WINDOW"
    | "MISSING_CONFIDENCE_INPUT"
    | "MISSING_SCORE_INPUT"
    | "NO_PROJECT_ITEMS";
  ruleVersion: typeof PHASE_0_RULE_VERSION;
  evaluatedAt: string;
  evidence: readonly EvidenceReference[];
  caveats: readonly string[];
}>;

export type SuppressedResult = Readonly<{
  status: "suppressed";
  reason:
    | "LOW_DATA_CONFIDENCE"
    | "MISSING_APPROVED_COST"
    | "MISSING_CURRENCY"
    | "CONFLICTING_INPUTS"
    | "DEPENDENCY_SUPPRESSED";
  ruleVersion: typeof PHASE_0_RULE_VERSION;
  evaluatedAt: string;
  evidence: readonly EvidenceReference[];
  caveats: readonly string[];
}>;

export function unknownResult(
  context: CalculationContext,
  reason: UnknownResult["reason"],
  caveats: readonly string[],
): UnknownResult {
  return {
    status: "unknown",
    reason,
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: context.evaluatedAt,
    evidence: context.evidence,
    caveats,
  };
}

export function suppressedResult<Reason extends SuppressedResult["reason"]>(
  context: CalculationContext,
  reason: Reason,
  caveats: readonly string[],
): SuppressedResult & Readonly<{ reason: Reason }> {
  return {
    status: "suppressed",
    reason,
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: context.evaluatedAt,
    evidence: context.evidence,
    caveats,
  };
}

export function mergeEvidence(
  ...groups: readonly (readonly EvidenceReference[])[]
): readonly EvidenceReference[] {
  const unique = new Map<string, EvidenceReference>();

  for (const evidence of groups.flat()) {
    unique.set(
      `${evidence.sourceType}:${evidence.recordId}:${evidence.observedAt}`,
      evidence,
    );
  }

  return [...unique.values()].sort((left, right) =>
    `${left.sourceType}:${left.recordId}`.localeCompare(
      `${right.sourceType}:${right.recordId}`,
    ),
  );
}

export function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
