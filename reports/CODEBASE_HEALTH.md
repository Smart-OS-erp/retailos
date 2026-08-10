# Codebase Health Baseline

Date: 2026-08-10

Scope: Phase 2B M2.9 senior SWE readiness baseline. This is a measurement and prioritization report, not a broad refactor authorization.

## Summary

Measured with `npm run code-health`.

| Metric | Value |
| --- | ---: |
| Tracked source/test/script files | 205 |
| Total tracked lines | 29,558 |
| Files >= 250 lines | 25 |
| `any` occurrences | 9 |
| `@ts-ignore` / `@ts-expect-error` occurrences | 2 |
| Non-null assertion member uses (`!.`) | 158 |
| `eslint-disable` occurrences | 1 |
| `TODO` / `FIXME` occurrences | 11 |

## Largest source/test/script files

| Lines | File |
| ---: | --- |
| 2,506 | `src/types/database.ts` |
| 1,349 | `src/app/globals.css` |
| 1,060 | `tests/integration/phase0-5-integration-hub.test.ts` |
| 806 | `tests/integration/phase1-inventory-core.test.ts` |
| 743 | `tests/integration/phase0-consolidation-hub.test.ts` |
| 704 | `scripts/demo/aso-collective.ts` |
| 519 | `tests/integration/phase0-end-to-end-acceptance.test.ts` |
| 516 | `scripts/security/live-phase1-workflow-smoke.ts` |
| 447 | `src/app/inventory/actions.ts` |
| 414 | `src/app/data/actions.ts` |
| 410 | `src/components/integration-hub.tsx` |
| 390 | `src/lib/integrations/scheduled-sync.ts` |
| 372 | `src/app/inventory/transfers/[transferId]/page.tsx` |
| 358 | `src/app/inventory/counts/[countId]/page.tsx` |
| 340 | `tests/integration/phase0-foundation-expansion.test.ts` |

## Largest migrations

| Lines | Migration |
| ---: | --- |
| 1,209 | `20260718103000_phase1_inventory_operations_core.sql` |
| 924 | `20260707100000_phase0_5_integration_hub.sql` |
| 803 | `20260718093000_phase1_inventory_core_foundations.sql` |
| 712 | `20260718213000_phase2_merchandising_planning_m0_m6.sql` |
| 707 | `20260705140000_phase0_foundation_expansion.sql` |

## Risk interpretation

The repository is not in a broken state, but it has predictable accumulated complexity from milestone-driven implementation:

- large integration tests are valuable but should be modularized before pilot-grade expansion;
- important business calculations exist in SQL views/functions, TypeScript intelligence modules, UI presentation, and tests;
- generated database types are expected to be large and should not be manually edited;
- action files over 300 lines should be reviewed before adding more workflows;
- migration size is high enough that Supabase CLI migration-history/reset verification remains important.

## Immediate remediation applied

- Added `npm run code-health` to make this scan repeatable.
- Added canonical harness validation to prevent roadmap/report drift.
- Added branch/release governance files.

## Deferred remediation

Do not perform broad cosmetic refactors during Phase 2B M2.7-M2.9. Refactor only when a finding is P0 or a low-risk P1.
