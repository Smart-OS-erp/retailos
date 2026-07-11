import {
  CONFIDENCE_SUPPRESSION_THRESHOLD,
  PHASE_0_RULE_VERSION,
  type CalculationContext,
  type SuppressedResult,
  type UnknownResult,
  roundScore,
  suppressedResult,
  unknownResult,
} from "./types";

export type ConfidenceInput = Readonly<{
  completeness: number | null;
  freshness: number | null;
  consistency: number | null;
}>;

export type DataConfidenceResult =
  | Readonly<{
      status: "known";
      score: number;
      band: "adequate" | "strong";
      basis: Readonly<{
        completeness: number;
        freshness: number;
        consistency: number;
        weights: Readonly<{
          completeness: 0.4;
          freshness: 0.3;
          consistency: 0.3;
        }>;
      }>;
      suppressionThreshold: typeof CONFIDENCE_SUPPRESSION_THRESHOLD;
      ruleVersion: typeof PHASE_0_RULE_VERSION;
      evaluatedAt: string;
      evidence: CalculationContext["evidence"];
      caveats: readonly string[];
    }>
  | (SuppressedResult &
      Readonly<{
        reason: "LOW_DATA_CONFIDENCE";
        score: number;
        suppressionThreshold: typeof CONFIDENCE_SUPPRESSION_THRESHOLD;
      }>)
  | UnknownResult;

function isPercentage(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function calculateDataConfidence(
  input: ConfidenceInput,
  context: CalculationContext,
): DataConfidenceResult {
  if (
    input.completeness === null ||
    input.freshness === null ||
    input.consistency === null
  ) {
    return unknownResult(context, "MISSING_CONFIDENCE_INPUT", [
      "Completeness, freshness, and consistency are all required.",
    ]);
  }

  if (
    !isPercentage(input.completeness) ||
    !isPercentage(input.freshness) ||
    !isPercentage(input.consistency)
  ) {
    return unknownResult(context, "INVALID_INPUT", [
      "Confidence inputs must be percentages from 0 to 100.",
    ]);
  }

  const score = roundScore(
    input.completeness * 0.4 +
      input.freshness * 0.3 +
      input.consistency * 0.3,
  );

  if (score < CONFIDENCE_SUPPRESSION_THRESHOLD) {
    return {
      ...suppressedResult(context, "LOW_DATA_CONFIDENCE", [
        `Recommendations are suppressed below ${CONFIDENCE_SUPPRESSION_THRESHOLD}% confidence.`,
      ]),
      score,
      suppressionThreshold: CONFIDENCE_SUPPRESSION_THRESHOLD,
    };
  }

  return {
    status: "known",
    score,
    band: score >= 80 ? "strong" : "adequate",
    basis: {
      completeness: input.completeness,
      freshness: input.freshness,
      consistency: input.consistency,
      weights: { completeness: 0.4, freshness: 0.3, consistency: 0.3 },
    },
    suppressionThreshold: CONFIDENCE_SUPPRESSION_THRESHOLD,
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: context.evaluatedAt,
    evidence: context.evidence,
    caveats: [],
  };
}
