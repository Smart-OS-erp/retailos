import type { DataConfidenceResult } from "./confidence";
import type { InventoryAgeResult, SalesWindowResult } from "./rules";
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
import type { InventoryValuationResult } from "./value";

type KnownConfidence = Extract<DataConfidenceResult, { status: "known" }>;

export type InventoryRiskResult =
  | Readonly<{
      status: "known";
      score: number;
      band: "low" | "moderate" | "high" | "critical";
      basis: Readonly<{ ageRisk: number; salesRisk: number }>;
      ruleVersion: typeof PHASE_0_RULE_VERSION;
      evaluatedAt: string;
      evidence: CalculationContext["evidence"];
      caveats: readonly string[];
    }>
  | SuppressedResult
  | UnknownResult;

const ageRiskByBand = { fresh: 10, watch: 35, aged: 70, dead: 100 } as const;

function salesRisk(sales: Extract<SalesWindowResult, { status: "known" }>): number {
  if (sales.trend === "no_sales") return 100;
  if (sales.trend === "new_activity") return 10;
  if (sales.trend === "declining") {
    return sales.changePercent !== null && sales.changePercent <= -50 ? 90 : 70;
  }
  if (sales.trend === "stable") return 40;
  return 15;
}

function dependencyContext(
  context: CalculationContext,
  ...results: readonly { evidence: CalculationContext["evidence"] }[]
): CalculationContext {
  return {
    evaluatedAt: context.evaluatedAt,
    evidence: mergeEvidence(context.evidence, ...results.map((result) => result.evidence)),
  };
}

export function calculateInventoryRisk(input: {
  age: InventoryAgeResult;
  sales: SalesWindowResult;
  confidence: DataConfidenceResult;
  context: CalculationContext;
}): InventoryRiskResult {
  const context = dependencyContext(
    input.context,
    input.age,
    input.sales,
    input.confidence,
  );

  if (input.confidence.status === "suppressed") {
    return suppressedResult(context, "LOW_DATA_CONFIDENCE", [
      "Inventory risk is suppressed because data confidence is below 60%.",
    ]);
  }
  if (
    input.age.status !== "known" ||
    input.sales.status !== "known" ||
    input.confidence.status !== "known"
  ) {
    return unknownResult(context, "MISSING_SCORE_INPUT", [
      "Known age, sales-window, and confidence results are required.",
    ]);
  }

  const ageRisk = ageRiskByBand[input.age.band];
  const salesRiskScore = salesRisk(input.sales);
  const score = roundScore(ageRisk * 0.6 + salesRiskScore * 0.4);
  const band =
    score >= 80
      ? "critical"
      : score >= 60
        ? "high"
        : score >= 35
          ? "moderate"
          : "low";

  return {
    status: "known",
    score,
    band,
    basis: { ageRisk, salesRisk: salesRiskScore },
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: input.context.evaluatedAt,
    evidence: context.evidence,
    caveats: ["Inventory Risk weights age at 60% and eligible sales behavior at 40%."],
  };
}

export type RecoveryOpportunityResult =
  | Readonly<{
      status: "known";
      score: number;
      band: "monitor" | "review" | "strong";
      proposedNextStep:
        | "continue_monitoring"
        | "review_recovery_evidence"
        | "draft_recovery_project";
      proposalOnly: true;
      ruleVersion: typeof PHASE_0_RULE_VERSION;
      evaluatedAt: string;
      evidence: CalculationContext["evidence"];
      caveats: readonly string[];
    }>
  | SuppressedResult
  | UnknownResult;

export function calculateRecoveryOpportunity(input: {
  risk: InventoryRiskResult;
  confidence: DataConfidenceResult;
  valuation: InventoryValuationResult;
  context: CalculationContext;
}): RecoveryOpportunityResult {
  const context = dependencyContext(
    input.context,
    input.risk,
    input.confidence,
    input.valuation,
  );

  if (
    input.risk.status === "suppressed" ||
    input.confidence.status === "suppressed" ||
    input.valuation.status === "suppressed"
  ) {
    return suppressedResult(context, "DEPENDENCY_SUPPRESSED", [
      "Recovery opportunity is suppressed until confidence and valuation are available.",
    ]);
  }
  if (
    input.risk.status !== "known" ||
    input.confidence.status !== "known" ||
    input.valuation.status !== "known"
  ) {
    return unknownResult(context, "MISSING_SCORE_INPUT", [
      "Known risk, confidence, and approved-cost valuation are required.",
    ]);
  }

  const score = roundScore(input.risk.score * 0.75 + input.confidence.score * 0.25);
  const band = score >= 75 ? "strong" : score >= 50 ? "review" : "monitor";
  const proposedNextStep =
    band === "strong"
      ? "draft_recovery_project"
      : band === "review"
        ? "review_recovery_evidence"
        : "continue_monitoring";

  return {
    status: "known",
    score,
    band,
    proposedNextStep,
    proposalOnly: true,
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: input.context.evaluatedAt,
    evidence: context.evidence,
    caveats: [
      "This result proposes an internal workflow step only; it does not change price or stock.",
      "Recovery Opportunity weights inventory risk at 75% and data confidence at 25%.",
    ],
  };
}

export type AttentionPriorityResult =
  | Readonly<{
      status: "known";
      score: number;
      band: "low" | "medium" | "high" | "urgent";
      ruleVersion: typeof PHASE_0_RULE_VERSION;
      evaluatedAt: string;
      evidence: CalculationContext["evidence"];
      caveats: readonly string[];
    }>
  | SuppressedResult
  | UnknownResult;

export function calculateAttentionPriority(input: {
  opportunity: RecoveryOpportunityResult;
  risk: InventoryRiskResult;
  confidence: DataConfidenceResult;
  context: CalculationContext;
}): AttentionPriorityResult {
  const context = dependencyContext(
    input.context,
    input.opportunity,
    input.risk,
    input.confidence,
  );

  if (
    input.opportunity.status === "suppressed" ||
    input.risk.status === "suppressed" ||
    input.confidence.status === "suppressed"
  ) {
    return suppressedResult(context, "DEPENDENCY_SUPPRESSED", [
      "Attention ranking is suppressed when a required score is suppressed.",
    ]);
  }
  if (
    input.opportunity.status !== "known" ||
    input.risk.status !== "known" ||
    input.confidence.status !== "known"
  ) {
    return unknownResult(context, "MISSING_SCORE_INPUT", [
      "Known opportunity, risk, and confidence scores are required.",
    ]);
  }

  const score = roundScore(
    input.opportunity.score * 0.6 +
      input.risk.score * 0.25 +
      input.confidence.score * 0.15,
  );
  const band =
    score >= 75 ? "urgent" : score >= 60 ? "high" : score >= 40 ? "medium" : "low";

  return {
    status: "known",
    score,
    band,
    ruleVersion: PHASE_0_RULE_VERSION,
    evaluatedAt: input.context.evaluatedAt,
    evidence: context.evidence,
    caveats: [
      "Attention Priority weights opportunity at 60%, risk at 25%, and confidence at 15%.",
    ],
  };
}

export type KnownDataConfidence = KnownConfidence;
