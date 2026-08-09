# Phase 0 Acceptance Evidence

Date: August 9, 2026

Dataset: `ASO_PHASE0_DATASET_V1`

## Local M0.21 evidence

| Command | Outcome |
| --- | --- |
| `npm run test:integration -- --run tests/integration/phase0-end-to-end-acceptance.test.ts` | Passed: 8 integration files, 55 tests |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test` | Passed: 30 files, 140 tests |
| `npm run test:unit` | Passed: 21 files, 81 tests |
| `npm run test:integration` | Passed: 8 files, 55 tests |
| `npm run test:security` | Passed: 1 file, 4 tests |
| `npm run security` | Passed |
| `npm run build` | Passed |
| `npm audit --audit-level=moderate` | Passed: 0 vulnerabilities |
| `npm run demo:seed` | Passed |
| `npm run demo:verify` | Passed |
| `npm run demo:reset` | Passed |
| `npm run demo:cleanup` | Passed |

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

## Release evidence

- Pull request: https://github.com/Smart-OS-erp/retailos/pull/50
- Merge commit: `7a8bd27e926410360846175294ac523b5195c202`
- Preview deployment: `https://retailos-7hcgu7uvv-tonybabalola-1114s-projects.vercel.app`
- Preview error logs: no logs found in inspected window.
- Production deployment: `dpl_9Roz2J2P3MgKfBpSzcsGsRxqD5AT`
- Production URL: `https://retailos-ten.vercel.app`
- Production smoke:
  - `/` returned 307.
  - `/login` returned 200.
  - `/setup-error` returned 200.
  - `/data` returned 307.
  - `/consolidation` returned 307.
  - `/inventory-recovery` returned 307.
  - `/projectisation` returned 307.
  - `/copilot` returned 307.
- Production error logs: no logs found in inspected window.
