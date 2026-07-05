import { describe, expect, it } from "vitest";

import {
  analyzeSalesWindow,
  calculateDataConfidence,
  calculateInventoryValue,
  calculateProjectisedValue,
  classifyInventoryAge,
  PHASE_0_RULE_VERSION,
  type CalculationContext,
} from "@/lib/intelligence";

const context: CalculationContext = {
  evaluatedAt: "2026-07-05T00:00:00.000Z",
  evidence: [
    {
      sourceType: "inventory_snapshot",
      recordId: "snapshot-1",
      observedAt: "2026-07-04T00:00:00.000Z",
    },
  ],
};

describe("approved Phase 0 inventory rules", () => {
  it.each([
    [60, "fresh"],
    [61, "watch"],
    [90, "watch"],
    [91, "aged"],
    [180, "aged"],
    [181, "dead"],
  ])("classifies %i days as %s", (days, band) => {
    const availableSince = new Date(
      Date.parse(context.evaluatedAt) - days * 86_400_000,
    ).toISOString();

    expect(classifyInventoryAge({ availableSince, context })).toMatchObject({
      status: "known",
      ageDays: days,
      band,
      ruleVersion: PHASE_0_RULE_VERSION,
    });
  });

  it("keeps missing age evidence unknown", () => {
    expect(classifyInventoryAge({ availableSince: null, context })).toMatchObject({
      status: "unknown",
      reason: "MISSING_AGE_EVIDENCE",
    });
  });

  it("compares the latest 30 days with the preceding 60-day normalized period", () => {
    const result = analyzeSalesWindow({
      observations: [
        { occurredAt: "2026-06-20T00:00:00.000Z", eligibleUnits: 10 },
        { occurredAt: "2026-05-20T00:00:00.000Z", eligibleUnits: 20 },
        { occurredAt: "2026-04-20T00:00:00.000Z", eligibleUnits: 20 },
      ],
      coverageDays: 90,
      context,
    });

    expect(result).toMatchObject({
      status: "known",
      windowDays: 90,
      comparisonDays: 30,
      current30DayUnits: 10,
      prior60DayUnits: 40,
      prior30DayEquivalentUnits: 20,
      changePercent: -50,
      trend: "declining",
    });
  });

  it("does not treat incomplete sales coverage as zero sales", () => {
    expect(
      analyzeSalesWindow({ observations: [], coverageDays: 89, context }),
    ).toMatchObject({
      status: "unknown",
      reason: "INCOMPLETE_SALES_WINDOW",
    });
  });

  it("applies the approved 40/30/30 confidence formula and suppresses below 60", () => {
    expect(
      calculateDataConfidence(
        { completeness: 50, freshness: 60, consistency: 70 },
        context,
      ),
    ).toMatchObject({
      status: "suppressed",
      reason: "LOW_DATA_CONFIDENCE",
      score: 59,
      suppressionThreshold: 60,
    });

    expect(
      calculateDataConfidence(
        { completeness: 80, freshness: 90, consistency: 70 },
        context,
      ),
    ).toMatchObject({ status: "known", score: 80, band: "strong" });
  });

  it("suppresses valuation without approved cost", () => {
    expect(
      calculateInventoryValue({
        quantity: 12,
        unitCost: null,
        costApproved: false,
        currency: "NGN",
        context,
      }),
    ).toMatchObject({
      status: "suppressed",
      reason: "MISSING_APPROVED_COST",
    });
  });

  it("does not aggregate currencies or invent FX", () => {
    const ngn = calculateInventoryValue({
      quantity: 2,
      unitCost: 1_000,
      costApproved: true,
      currency: "NGN",
      context,
    });
    const ghs = calculateInventoryValue({
      quantity: 3,
      unitCost: 100,
      costApproved: true,
      currency: "GHS",
      context,
    });

    expect(calculateProjectisedValue([ngn, ghs], context)).toEqual(
      expect.objectContaining({
        status: "not_aggregated",
        reason: "MULTIPLE_CURRENCIES_NO_FX",
        totalsByCurrency: { GHS: 300, NGN: 2_000 },
      }),
    );
  });
});
