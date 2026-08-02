# Phase 2 Acceptance Evidence - M2.0 to M2.6

Date: July 18, 2026

## Local evidence

| Command | Outcome |
| --- | --- |
| `npm run test:integration -- --run tests/integration/phase2-merchandising-planning.test.ts` | Passed: 7 files, 52 tests |
| `npm run typecheck` | Passed after Phase 2 UI/type wiring |

## Hosted evidence

| Command | Outcome |
| --- | --- |
| Hosted SQL application for `supabase/migrations/20260718213000_phase2_merchandising_planning_m0_m6.sql` | Applied or reconciled without printing secrets |
| `node scripts/security/live-phase2-hosted-schema.ts` | Passed: 8 relations/views, 5 functions |

## Scenario coverage

- Viewer with explicit location scope can read historical product productivity.
- Store manager cannot read merchandising productivity rows.
- Viewer cannot generate merchandising recommendations.
- Merchandising manager can generate recommendations.
- No-sales stock produces a markdown-review recommendation with low confidence.
- Markdown recommendation can be converted into a draft without executing a price change.
- Merchandising manager can create a planning cycle.
- Merchandising manager can upsert an assortment plan item.
- Merchandising manager can approve a planning cycle.
- Owner can verify audit evidence for recommendation generation, planning cycle creation/approval, and assortment item upsert.

## Known conditions

- Production deployment and route smoke are pending this branch PR merge.
- Supabase CLI migration-history/reset remains unverified because the CLI is not installed/authenticated in this shell.
