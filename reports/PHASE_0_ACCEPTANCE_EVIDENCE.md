# Phase 0 Acceptance Evidence

Date: August 9, 2026

Dataset: `ASO_PHASE0_DATASET_V1`

## Local M0.21 evidence

| Command | Outcome |
| --- | --- |
| `npm run test:integration -- --run tests/integration/phase0-end-to-end-acceptance.test.ts` | Passed: 8 integration files, 55 tests |

## Journey evidence

The M0.21 integration acceptance test seeds a representative deterministic Aso Collective subset into the existing Phase 0 database path and verifies:

- invalid source data remains blocked;
- warning/review records can be explicitly accepted;
- consolidation is idempotent;
- source lineage is retained in consolidation items;
- current operating view uses consolidated records;
- intelligence run creates confidence/risk/opportunity evidence;
- recovery opportunity is projectised;
- project is submitted and approved by a different permitted user;
- campaign brief is created and approved;
- project tasks are created and can transition;
- Retail Copilot answers a project question with citations and `executes_actions = false`;
- another tenant cannot read Aso inventory;
- viewer cannot run intelligence;
- store manager sees only assigned-location inventory.

## Dataset lifecycle evidence

M0.20 commands remain required during final M0.21 validation:

- `npm run demo:seed`
- `npm run demo:verify`
- `npm run demo:reset`
- `npm run demo:cleanup`

## Conditional evidence gaps

- Authenticated browser workflow was not fully exercised in this shell.
- Authenticated production synthetic workflow was not run.
- Supabase CLI migration-history comparison and local `supabase db reset` remain unavailable in this shell.
- Original consultant review remains pending.
- Real retailer pilot validation remains pending.

These gaps do not mean the repository is unsafe to deploy; they prevent `PHASE_0_ACCEPTED`.
