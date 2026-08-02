# Phase 2 Acceptance Evidence - M2.0 to M2.6

Date: August 2, 2026

## Local evidence

| Command | Outcome |
| --- | --- |
| `npm run test:integration -- --run tests/integration/phase2-merchandising-planning.test.ts` | Passed: 7 files, 52 tests |
| `npm run typecheck` | Passed after Phase 2 UI/type wiring |
| `npm run lint` | Passed during final release validation |
| `npm run security` | Passed during final release validation |
| `npm run test` | Passed: 28 files, 133 tests |
| `npm run build` | Passed on Next.js 16.2.12 |
| `npm audit --audit-level=moderate` | Passed after dependency security patch: 0 vulnerabilities |

## Hosted evidence

| Command | Outcome |
| --- | --- |
| Hosted SQL application for `supabase/migrations/20260718213000_phase2_merchandising_planning_m0_m6.sql` | Applied or reconciled without printing secrets |
| `node scripts/security/live-phase2-hosted-schema.ts` | Passed: 8 relations/views, 5 functions |
| PR #46 checks | Passed: Quality, Security foundation checks, Vercel preview, and Vercel Preview Comments |
| Production deployment | Ready: `dpl_CzeC5JyAYJZegKAoLkBAvRWk6Xpc` on `https://retailos-ten.vercel.app` |
| Production route smoke | Passed without 5xx: `/`, `/login`, `/merchandising`, `/merchandising/productivity`, `/merchandising/performance`, `/merchandising/recommendations`, `/merchandising/markdowns`, `/merchandising/plans` |
| Vercel production error logs | No error logs found in the inspected 10-minute window |

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

- Supabase CLI migration-history/reset remains unverified because the CLI is not installed/authenticated in this shell.
- Local shell uses Node.js `v26.3.0`, which prints npm engine warnings for packages expecting Node `>=22 <23`; Vercel production is configured for Node `22.x`, and release validation still passed locally.
