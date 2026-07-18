# Phase 1 Acceptance Evidence

Date: July 18, 2026
Environment: local repository plus hosted Supabase project configured through ignored `.env.local`.

## Commands and outcomes

| Command | Outcome |
| --- | --- |
| `node --check scripts/security/live-phase1-workflow-smoke.ts` | Passed |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test:integration -- --run tests/integration/phase1-inventory-core.test.ts` | Passed: 6 files, 49 tests |
| Hosted SQL application for `supabase/migrations/20260718210000_phase1_visible_workflow_acceptance.sql` | Applied or reconciled without printing secrets |
| `node scripts/security/live-phase1-hosted-schema.ts` | Passed: 15 relations/views, 16 functions |
| `node scripts/security/live-phase1-workflow-smoke.ts` | Passed and synthetic cleanup passed |

## Live workflow smoke coverage

The live smoke created synthetic confirmed users and a synthetic tenant, exercised the workflow through authenticated Supabase clients, verified fail-closed role/location paths, checked audit-event creation, and then removed synthetic records/users.

Covered workflows:

- inventory search by SKU code;
- saved inventory watchlist add, duplicate update, viewer denial, and remove;
- stock adjustment request, approval, execution, duplicate execution retry, reversal, and balance reconciliation;
- transfer request, approval, dispatch, duplicate dispatch retry, partial receipt, final receipt, and in-transit reconciliation;
- stock count submit, review, reconciliation issue decision, close, duplicate close retry, and correction movement reconciliation;
- store-manager unassigned-location denial;
- suspended-membership denial;
- audit evidence for watchlist, adjustment, transfer, and stock-count actions.

## Failure found and resolved

Initial run result:

- Workflow assertions passed.
- Cleanup failed because synthetic `event_log` records referenced locations.

Resolution:

- Added `event_log` to the synthetic cleanup order before deleting locations.
- Reran the live smoke successfully with cleanup passing.

## Remaining conditions

- This acceptance branch still needs PR merge and production route smoke after deployment.
- Supabase CLI migration-history verification and local reset remain blocked because the CLI is not installed/authenticated in this shell.
