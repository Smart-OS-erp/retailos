import { describe, expect, it } from "vitest";

import {
  analyzeSalesWindow,
  calculateAttentionPriority,
  calculateDataConfidence,
  calculateInventoryRisk,
  calculateInventoryValue,
  calculateRecoveryOpportunity,
  classifyInventoryAge,
  formatCopilotExplanation,
  formatCopilotRefusal,
  type CalculationContext,
} from "@/lib/intelligence";

const context: CalculationContext = {
  evaluatedAt: "2026-07-05T00:00:00.000Z",
  evidence: [
    {
      sourceType: "sku_inventory",
      recordId: "sku-42",
      observedAt: "2026-07-04T00:00:00.000Z",
    },
  ],
};

function knownFixture() {
  const age = classifyInventoryAge({
    availableSince: "2025-12-01T00:00:00.000Z",
    context,
  });
  const sales = analyzeSalesWindow({ observations: [], coverageDays: 90, context });
  const confidence = calculateDataConfidence(
    { completeness: 90, freshness: 80, consistency: 90 },
    context,
  );
  const valuation = calculateInventoryValue({
    quantity: 5,
    unitCost: 10_000,
    costApproved: true,
    currency: "NGN",
    context,
  });
  const risk = calculateInventoryRisk({ age, sales, confidence, context });
  const opportunity = calculateRecoveryOpportunity({
    risk,
    confidence,
    valuation,
    context,
  });
  const attention = calculateAttentionPriority({
    opportunity,
    risk,
    confidence,
    context,
  });

  return { age, sales, confidence, valuation, risk, opportunity, attention };
}

describe("Phase 0 deterministic scoring", () => {
  it("scores explainable dead stock and only proposes a workflow step", () => {
    const fixture = knownFixture();

    expect(fixture.risk).toMatchObject({
      status: "known",
      score: 100,
      band: "critical",
      basis: { ageRisk: 100, salesRisk: 100 },
    });
    expect(fixture.opportunity).toMatchObject({
      status: "known",
      score: 96.75,
      band: "strong",
      proposedNextStep: "draft_recovery_project",
      proposalOnly: true,
    });
    expect(fixture.attention).toMatchObject({
      status: "known",
      score: 96.1,
      band: "urgent",
    });
  });

  it("propagates low-confidence suppression instead of producing scores", () => {
    const age = classifyInventoryAge({
      availableSince: "2025-12-01T00:00:00.000Z",
      context,
    });
    const sales = analyzeSalesWindow({ observations: [], coverageDays: 90, context });
    const confidence = calculateDataConfidence(
      { completeness: 40, freshness: 50, consistency: 60 },
      context,
    );

    expect(
      calculateInventoryRisk({ age, sales, confidence, context }),
    ).toMatchObject({
      status: "suppressed",
      reason: "LOW_DATA_CONFIDENCE",
    });
  });

  it("produces deterministic Copilot copy with evidence and no execution", () => {
    const fixture = knownFixture();
    const explanation = formatCopilotExplanation({
      subjectLabel: "SKU 42",
      confidence: fixture.confidence,
      risk: fixture.risk,
      opportunity: fixture.opportunity,
      attention: fixture.attention,
      valuation: fixture.valuation,
    });

    expect(explanation).toMatchObject({
      status: "explained",
      heading: "SKU 42: urgent attention",
      proposalOnly: true,
      executesActions: false,
      proposedNextStep: "draft recovery project",
    });
    expect(explanation.citations).toEqual(context.evidence);
    expect(explanation.summary).toContain("100/100");
    expect(explanation.rationale).toContain(
      "Approved-cost inventory value is 50000.00 NGN.",
    );
  });

  it("refuses cross-tenant explanation without leaking citations", () => {
    expect(formatCopilotRefusal("cross_tenant")).toMatchObject({
      status: "refused",
      citations: [],
      proposedNextStep: null,
      executesActions: false,
    });
  });
});
