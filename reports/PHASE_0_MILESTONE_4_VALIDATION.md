# Phase 0 Milestone 4 Validation

## Outcome

Milestone 4 — Deterministic Intelligence is implemented and verified locally on
the `phase-0-end-to-end` branch. Hosted migration and protected-preview
verification remain pending.

## Implemented evidence

- Immutable, versioned intelligence runs, inventory risk insights, recovery
  opportunities, executive briefings, and action cards.
- Database-authored Data Confidence, Inventory Risk, Recovery Opportunity, and
  Attention Priority results from the latest approved snapshot only.
- Approved age bands, 90/30-day sales comparison, 40/30/30 confidence weights,
  below-60 suppression, approved-cost valuation, and proposal-only actions.
- Currency-separated executive totals with no FX conversion or fabricated
  cross-currency total.
- Live Inventory Recovery, SKU, age, category, store, Executive Briefing, and
  Attention Queue surfaces with rule-version and suppression evidence.
- Negative evidence for client-authored score denial, run idempotency,
  low-confidence suppression, and store location isolation.

## Commands and results

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test` — passed: 12 files, 61 tests.
- `npm run security` — passed: 27 public tenant tables covered by the migration
  contract; scanners remain heuristic evidence.
- `npm run build` — passed: Next.js production build with 30 application routes.

## Gate decision

Milestone 4 is accepted locally. Milestone 5 may begin. Hosted database and
browser evidence are not yet claimed.
