import { describe, expect, it } from "vitest";

import {
  canApproveProject,
  canTransitionProject,
  generateCampaignBrief,
  roleWorkspacePath,
} from "@/lib/workflows/domain";

describe("Phase 0 recovery workflow", () => {
  it("allows only reviewed project transitions", () => {
    expect(canTransitionProject("draft", "pending_approval")).toBe(true);
    expect(canTransitionProject("draft", "approved")).toBe(false);
    expect(canTransitionProject("completed", "in_progress")).toBe(false);
  });

  it("separates drafting from approval", () => {
    expect(canApproveProject("org_owner")).toBe(true);
    expect(canApproveProject("executive")).toBe(true);
    expect(canApproveProject("merchandising_manager")).toBe(false);
    expect(canApproveProject("store_manager")).toBe(false);
    expect(canApproveProject("viewer")).toBe(false);
  });

  it("generates deterministic proposal-only campaign content", () => {
    const input = {
      projectName: "Aged denim recovery",
      opportunityTitle: "Reposition aged denim",
      skuLabels: ["DENIM-2", "DENIM-1", "DENIM-2"],
      evidenceSummary: "Approved inventory positions show aged units with no eligible sales.",
      currencyCode: "ngn",
      estimatedValueMinor: 125_000,
    } as const;

    expect(generateCampaignBrief(input)).toEqual(generateCampaignBrief(input));
    expect(generateCampaignBrief(input).productFocus).toEqual(["DENIM-1", "DENIM-2"]);
    expect(generateCampaignBrief(input).valueContext).toBe(
      "1250.00 NGN of approved-cost inventory is in scope.",
    );
    expect(generateCampaignBrief(input).constraints[0]).toContain("Proposal only");
  });

  it("maps each role to an explicit workspace", () => {
    expect(roleWorkspacePath("org_owner")).toBe("/workspace/executive");
    expect(roleWorkspacePath("executive")).toBe("/workspace/executive");
    expect(roleWorkspacePath("merchandising_manager")).toBe("/workspace/merchandising");
    expect(roleWorkspacePath("store_manager")).toBe("/workspace/store");
    expect(roleWorkspacePath("viewer")).toBe("/workspace/viewer");
  });
});
