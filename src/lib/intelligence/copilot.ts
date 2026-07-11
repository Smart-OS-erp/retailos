import type { DataConfidenceResult } from "./confidence";
import type {
  AttentionPriorityResult,
  InventoryRiskResult,
  RecoveryOpportunityResult,
} from "./scoring";
import {
  PHASE_0_RULE_VERSION,
  type EvidenceReference,
  mergeEvidence,
} from "./types";
import type { InventoryValuationResult } from "./value";

export type CopilotExplanation = Readonly<{
  status: "explained" | "insufficient_evidence" | "refused";
  heading: string;
  summary: string;
  rationale: readonly string[];
  limitations: readonly string[];
  citations: readonly EvidenceReference[];
  proposedNextStep: string | null;
  proposalOnly: true;
  executesActions: false;
  ruleVersion: typeof PHASE_0_RULE_VERSION;
}>;

export function formatCopilotExplanation(input: {
  subjectLabel: string;
  confidence: DataConfidenceResult;
  risk: InventoryRiskResult;
  opportunity: RecoveryOpportunityResult;
  attention: AttentionPriorityResult;
  valuation: InventoryValuationResult;
}): CopilotExplanation {
  const results = [
    input.confidence,
    input.risk,
    input.opportunity,
    input.attention,
    input.valuation,
  ];
  const citations = mergeEvidence(...results.map((result) => result.evidence));
  const unavailable = results.filter((result) => result.status !== "known");

  if (unavailable.length > 0) {
    return {
      status: "insufficient_evidence",
      heading: `${input.subjectLabel}: insufficient evidence`,
      summary: "RetailOS cannot provide a recovery recommendation from the available evidence.",
      rationale: unavailable.map(
        (result) => `${result.status}: ${result.reason.replaceAll("_", " ").toLowerCase()}`,
      ),
      limitations: [...new Set(unavailable.flatMap((result) => result.caveats))],
      citations,
      proposedNextStep: "Review data quality and approved cost evidence.",
      proposalOnly: true,
      executesActions: false,
      ruleVersion: PHASE_0_RULE_VERSION,
    };
  }

  const confidence = input.confidence as Extract<DataConfidenceResult, { status: "known" }>;
  const risk = input.risk as Extract<InventoryRiskResult, { status: "known" }>;
  const opportunity = input.opportunity as Extract<RecoveryOpportunityResult, { status: "known" }>;
  const attention = input.attention as Extract<AttentionPriorityResult, { status: "known" }>;
  const valuation = input.valuation as Extract<InventoryValuationResult, { status: "known" }>;

  return {
    status: "explained",
    heading: `${input.subjectLabel}: ${attention.band} attention`,
    summary: `Inventory risk is ${risk.band} (${risk.score}/100) with ${confidence.score}% data confidence.`,
    rationale: [
      `The recovery opportunity is ${opportunity.band} (${opportunity.score}/100).`,
      `Approved-cost inventory value is ${valuation.value.toFixed(2)} ${valuation.currency}.`,
      `Attention Priority is ${attention.score}/100.`,
    ],
    limitations: [...new Set(results.flatMap((result) => result.caveats))],
    citations,
    proposedNextStep: opportunity.proposedNextStep.replaceAll("_", " "),
    proposalOnly: true,
    executesActions: false,
    ruleVersion: PHASE_0_RULE_VERSION,
  };
}

export function formatCopilotRefusal(
  reason: "unauthorized" | "cross_tenant" | "unsupported",
): CopilotExplanation {
  const messages = {
    unauthorized: "You do not have permission to access the requested evidence.",
    cross_tenant: "RetailOS cannot access information outside the active organization.",
    unsupported: "This request is outside the approved Phase 0 explanation scope.",
  } as const;

  return {
    status: "refused",
    heading: "Request refused",
    summary: messages[reason],
    rationale: [],
    limitations: ["Authorization and Phase 0 boundaries cannot be changed by a prompt."],
    citations: [],
    proposedNextStep: null,
    proposalOnly: true,
    executesActions: false,
    ruleVersion: PHASE_0_RULE_VERSION,
  };
}
