# RetailOS Harness Architecture

The harness is the control plane for roadmap, milestone eligibility, validation, and release evidence.

## Canonical machine-readable sources

- `harness/roadmap.yaml` — phase map and active campaign.
- `harness/milestones.yaml` — milestone status, dependencies, acceptance criteria, validation requirements, risk tier, reviewers, and evidence.
- `harness/quality-gates.yaml` — roles, evidence classes, command baseline, and migration safety rules.
- `harness/human-gates.yaml` — human gates and technical stop conditions.

## Human-readable outputs

- `reports/CURRENT_STATE.md`
- `reports/NEXT_TASK.md`
- `reports/OPEN_BLOCKERS.md`
- `reports/RECENT_FAILURES.md`
- structured files under `reports/release-evidence/`

Human-readable reports must not contradict canonical harness files.

## Tooling

- `npm run harness:validate` checks that canonical files and reports agree on critical state.
- `npm run harness:current-state` prints a current-state report from canonical files.
- `npm run code-health` prints a code-health measurement baseline.

## Design constraint

The harness should remain simple enough for senior engineers and local-model agents to inspect. Do not introduce a framework or database just to manage roadmap state.
