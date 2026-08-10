const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

const root = process.cwd();

const requiredFiles = [
  "harness/roadmap.yaml",
  "harness/milestones.yaml",
  "harness/quality-gates.yaml",
  "harness/human-gates.yaml",
  "reports/CURRENT_STATE.md",
  "reports/NEXT_TASK.md",
  "AGENTS.md",
  "README.md",
];

const requiredMilestones: Array<[string, string]> = [
  ["M0.20", "status: ACCEPTED"],
  ["M0.21", "status: CONDITIONALLY_ACCEPTED"],
  ["M1.9", "status: ACCEPTED"],
  ["M2.0-M2.6", "status: ACCEPTED"],
  ["M2.7", "status: ACCEPTED"],
  ["M2.8", "status: ACCEPTED"],
  ["M2.9", "status: ACCEPTED"],
  ["M2.10", "status: ACCEPTED"],
  ["M2.11", "status: ACCEPTED"],
];

const requiredRoadmapLabels = [
  "Phase 0 - Retail Intelligence, Data and Integration Foundation",
  "Phase 1 - Core Inventory Operating System",
  "Phase 2A - Light Merchandising Intelligence and Action Planning",
  "Phase 2B - Engineering Reconciliation, Domain Validation and Pilot Readiness",
  "Phase 2C - Full Merchandise Planning Suite",
  "Phase 12 - Optional Retail Network and Embedded Services",
];

const requiredEvidenceClasses = [
  "STATIC",
  "UNIT",
  "INTEGRATION",
  "DATABASE",
  "SECURITY",
  "BROWSER",
  "PRODUCTION",
  "DOMAIN",
  "HUMAN",
  "COMMERCIAL",
];

function read(relativePath: string): string {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required harness file: ${relativePath}`);
  }
  return readFileSync(absolutePath, "utf8");
}

function assertIncludes(source: string, needle: string, label: string): void {
  if (!source.includes(needle)) {
    throw new Error(`${label} missing required text: ${needle}`);
  }
}

for (const file of requiredFiles) {
  read(file);
}

const roadmap = read("harness/roadmap.yaml");
const milestones = read("harness/milestones.yaml");
const qualityGates = read("harness/quality-gates.yaml");
const humanGates = read("harness/human-gates.yaml");
const currentState = read("reports/CURRENT_STATE.md");
const nextTask = read("reports/NEXT_TASK.md");
const agents = read("AGENTS.md");
const readme = read("README.md");

for (const label of requiredRoadmapLabels) {
  assertIncludes(roadmap, label, "roadmap");
}

for (const [milestone, status] of requiredMilestones) {
  assertIncludes(milestones, `id: ${milestone}`, "milestones");
  const start = milestones.indexOf(`id: ${milestone}`);
  const next = milestones.indexOf("\n  - id:", start + 1);
  const section = milestones.slice(start, next === -1 ? undefined : next);
  assertIncludes(section, status, `milestone ${milestone}`);
}

for (const role of [
  "BUILDER",
  "REPOSITORY_REVIEWER",
  "DOMAIN_REVIEWER",
  "SECURITY_REVIEWER",
  "RELEASE_VERIFIER",
  "HUMAN_APPROVER",
]) {
  assertIncludes(qualityGates, role, "quality gates");
}

for (const evidenceClass of requiredEvidenceClasses) {
  assertIncludes(qualityGates, evidenceClass, "quality gates");
}

for (const gate of [
  "repository-visibility",
  "destructive-production-migration",
  "migration-history-disagreement",
]) {
  assertIncludes(humanGates, gate, "human gates");
}

assertIncludes(currentState, "Active Phase: Phase 2B", "current state");
assertIncludes(currentState, "Current Approved Milestones: M2.7-M2.11", "current state");
assertIncludes(nextTask, "Stop after M2.11", "next task");
assertIncludes(nextTask, "M2.12", "next task");
assertIncludes(agents, "harness/roadmap.yaml", "AGENTS");
assertIncludes(agents.toLowerCase(), "mandatory stop conditions", "AGENTS");
assertIncludes(readme, "Phase 2B", "README");

console.log("Canonical harness state validation passed.");
