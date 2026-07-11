import type { OrganizationRole } from "@/lib/auth/authorization";
import { PHASE_0_RULE_VERSION } from "@/lib/intelligence";

export const recoveryProjectStatuses = [
  "draft",
  "pending_approval",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type RecoveryProjectStatus = (typeof recoveryProjectStatuses)[number];

const allowedTransitions: Readonly<Record<RecoveryProjectStatus, readonly RecoveryProjectStatus[]>> = {
  draft: ["pending_approval", "cancelled"],
  pending_approval: ["draft", "approved", "cancelled"],
  approved: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransitionProject(
  from: RecoveryProjectStatus,
  to: RecoveryProjectStatus,
): boolean {
  return allowedTransitions[from].includes(to);
}

export function canApproveProject(role: OrganizationRole): boolean {
  return role === "org_owner" || role === "executive";
}

export type CampaignBriefInput = Readonly<{
  projectName: string;
  opportunityTitle: string;
  skuLabels: readonly string[];
  evidenceSummary: string;
  currencyCode: string | null;
  estimatedValueMinor: number | null;
}>;

export type CampaignBriefContent = Readonly<{
  objective: string;
  audience: string;
  proposition: string;
  productFocus: readonly string[];
  evidence: string;
  valueContext: string;
  constraints: readonly string[];
  ruleVersion: typeof PHASE_0_RULE_VERSION;
}>;

export function generateCampaignBrief(
  input: CampaignBriefInput,
): CampaignBriefContent {
  const currency = input.currencyCode?.trim().toUpperCase() ?? null;
  const valueContext =
    currency && input.estimatedValueMinor !== null
      ? `${(input.estimatedValueMinor / 100).toFixed(2)} ${currency} of approved-cost inventory is in scope.`
      : "Recoverable value is unavailable until approved cost and currency evidence are complete.";

  return {
    objective: `Prepare an internal recovery campaign proposal for ${input.projectName}.`,
    audience: "Existing customers who are relevant to the selected product story; segment selection remains a human decision.",
    proposition: input.opportunityTitle,
    productFocus: [...new Set(input.skuLabels.map((label) => label.trim()).filter(Boolean))].sort(),
    evidence: input.evidenceSummary,
    valueContext,
    constraints: [
      "Proposal only: no pricing, inventory, publishing, or customer-contact action is executed.",
      "A permitted approver must review current evidence before execution outside RetailOS.",
      "Phase 0 does not predict campaign outcomes.",
    ],
    ruleVersion: PHASE_0_RULE_VERSION,
  };
}

export function roleWorkspacePath(role: OrganizationRole): string {
  if (role === "org_owner" || role === "executive") return "/workspace/executive";
  if (role === "merchandising_manager") return "/workspace/merchandising";
  if (role === "store_manager") return "/workspace/store";
  return "/workspace/viewer";
}
