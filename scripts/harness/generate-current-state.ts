const { readFileSync } = require("node:fs");

const roadmap = readFileSync("harness/roadmap.yaml", "utf8");
const milestones = readFileSync("harness/milestones.yaml", "utf8");

function sectionForMilestone(id: string): string {
  const start = milestones.indexOf(`id: ${id}`);
  if (start === -1) {
    throw new Error(`Milestone not found: ${id}`);
  }
  const next = milestones.indexOf("\n  - id:", start + 1);
  return milestones.slice(start, next === -1 ? undefined : next);
}

const activePhaseLine = roadmap
  .split(/\r?\n/)
  .find((line, index, lines) => line.includes("Phase 2B") || lines[index + 1]?.includes("active: true"));

const m27 = sectionForMilestone("M2.7");
const m28 = sectionForMilestone("M2.8");
const m29 = sectionForMilestone("M2.9");

const report = `Project: RetailOS
Active Phase: Phase 2B - Engineering Reconciliation, Domain Validation and Pilot Readiness
Current Approved Milestones: M2.7-M2.9
Mode: Engineering reconciliation; no new product modules.

Canonical Sources:
- harness/roadmap.yaml
- harness/milestones.yaml
- harness/quality-gates.yaml
- harness/human-gates.yaml

Current Milestone Status:
- M2.7: ${m27.includes("status: ACCEPTED") ? "ACCEPTED" : "IN_PROGRESS"}
- M2.8: ${m28.includes("status: ACCEPTED") ? "ACCEPTED" : "IN_PROGRESS"}
- M2.9: ${m29.includes("status: ACCEPTED") ? "ACCEPTED" : "IN_PROGRESS"}

Stop Rule:
Stop after M2.9. Do not begin M2.11 or later without explicit approval.

Roadmap Anchor:
${activePhaseLine?.trim() ?? "Phase 2B"}
`;

console.log(report);
