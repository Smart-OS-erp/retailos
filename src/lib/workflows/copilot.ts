import type { Permission } from "@/lib/auth/authorization";
import {
  PHASE_0_RULE_VERSION,
  formatCopilotRefusal,
  type EvidenceReference,
} from "@/lib/intelligence";

export type CopilotFact = Readonly<{
  label: string;
  value: string;
  permission: Permission;
  evidence: EvidenceReference;
}>;

export type CopilotAnswer = Readonly<{
  status: "answered" | "insufficient_evidence" | "refused";
  heading: string;
  summary: string;
  facts: readonly CopilotFact[];
  citations: readonly EvidenceReference[];
  proposedNextStep: string | null;
  ruleVersion: typeof PHASE_0_RULE_VERSION;
}>;

function requestedPermission(question: string): Permission | null {
  const normalized = question.toLowerCase();
  if (/\b(project|approval|projectised)\b/.test(normalized)) return "project.view";
  if (/\b(task|action)\b/.test(normalized)) return "task.view";
  if (/\b(opportunit|risk|inventory|attention|brief)\b/.test(normalized)) {
    return "opportunity.view";
  }
  return null;
}

export function answerCopilotQuestion(input: {
  question: string;
  allowedPermissions: ReadonlySet<Permission>;
  facts: readonly CopilotFact[];
}): CopilotAnswer {
  const required = requestedPermission(input.question);
  if (required === null) {
    const refusal = formatCopilotRefusal("unsupported");
    return {
      status: "refused",
      heading: refusal.heading,
      summary: refusal.summary,
      facts: [],
      citations: [],
      proposedNextStep: null,
      ruleVersion: PHASE_0_RULE_VERSION,
    };
  }

  if (!input.allowedPermissions.has(required)) {
    const refusal = formatCopilotRefusal("unauthorized");
    return {
      status: "refused",
      heading: refusal.heading,
      summary: refusal.summary,
      facts: [],
      citations: [],
      proposedNextStep: null,
      ruleVersion: PHASE_0_RULE_VERSION,
    };
  }

  const permittedFacts = input.facts.filter(
    (fact) => fact.permission === required && input.allowedPermissions.has(fact.permission),
  );
  if (permittedFacts.length === 0) {
    return {
      status: "insufficient_evidence",
      heading: "No permitted evidence is available",
      summary: "RetailOS cannot answer this question until the relevant organization data is validated and persisted.",
      facts: [],
      citations: [],
      proposedNextStep: "Review Data Health and complete validation.",
      ruleVersion: PHASE_0_RULE_VERSION,
    };
  }

  return {
    status: "answered",
    heading: "RetailOS evidence summary",
    summary: "This deterministic answer uses only the current permitted organization records listed below.",
    facts: permittedFacts,
    citations: permittedFacts.map((fact) => fact.evidence),
    proposedNextStep:
      required === "task.view"
        ? "Review assigned tasks."
        : required === "project.view"
          ? "Review the project evidence and approval state."
          : "Open the Attention Queue and inspect the highest-ranked evidence.",
    ruleVersion: PHASE_0_RULE_VERSION,
  };
}
