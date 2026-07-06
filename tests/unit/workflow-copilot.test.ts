import { describe, expect, it } from "vitest";

import type { Permission } from "@/lib/auth/authorization";
import { answerCopilotQuestion } from "@/lib/workflows/copilot";

const fact = {
  label: "Urgent opportunity",
  value: "Aged denim",
  permission: "opportunity.view" as Permission,
  evidence: {
    sourceType: "recovery_opportunity",
    recordId: "opportunity-1",
    observedAt: "2026-07-05T12:00:00.000Z",
  },
};

describe("permission-aware deterministic Copilot", () => {
  it("returns only permitted, cited persisted facts", () => {
    const result = answerCopilotQuestion({
      question: "What inventory risk needs attention?",
      allowedPermissions: new Set<Permission>(["opportunity.view"]),
      facts: [fact],
    });

    expect(result.status).toBe("answered");
    expect(result.facts).toEqual([fact]);
    expect(result.citations).toEqual([fact.evidence]);
  });

  it("refuses a question outside the caller's permissions", () => {
    const result = answerCopilotQuestion({
      question: "Show project approvals",
      allowedPermissions: new Set<Permission>(["opportunity.view"]),
      facts: [fact],
    });

    expect(result.status).toBe("refused");
    expect(result.facts).toEqual([]);
    expect(result.citations).toEqual([]);
  });

  it("fails closed for unsupported prompts", () => {
    const result = answerCopilotQuestion({
      question: "Publish this campaign now",
      allowedPermissions: new Set<Permission>(["opportunity.view"]),
      facts: [fact],
    });

    expect(result.status).toBe("refused");
  });
});
