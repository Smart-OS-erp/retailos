# Business Rule Reconciliation

Date: 2026-08-10

## Decision

P1-3 is remediated to an acceptable pre-M2.11 baseline. The repository now has an explicit versioned business-rule contract and deterministic consistency tests.

## Implemented architecture

- Domain contract: `docs/domain/BUSINESS_RULE_CONTRACT.md`.
- Reference implementation: `src/lib/business-rules/retail-rules.ts`.
- Golden expected outcomes: `data/demo/aso-collective/versions/ASO_MERCHANDISING_PILOT_V3/golden-outcomes.json`.
- Tests: `tests/domain/retail-rule-contract.test.ts`.

## Rule version

`retailos-operating-model-v0.9.0`

## Rules covered

- inventory available quantity;
- inventory position compatibility;
- net units sold;
- sell-through;
- weeks of cover;
- weighted average weekly net sales;
- merchandise age;
- inventory risk/state;
- confidence;
- recovery action/ranking;
- productivity metric traceability;
- markdown eligibility/recommendation.

## Discrepancies discovered

### SQL compatibility naming

Existing Phase 2A SQL exposes 90-day merchandising fields such as `sell_through_rate_90`. The operating model defines canonical sell-through in terms of net units sold, opening available inventory, and receipts. This is classified as `VERSION_DIFFERENCE`, not an immediate bug, because the current production schema lacks full receipt/opening-window evidence for every path.

Resolution: keep existing production behavior compatible, add versioned rule contract and golden fixtures, and require future SQL/materialized metric changes to expose rule/version and input-window evidence.

### Missing-cost markdown precision

Margin-sensitive markdown recommendations cannot claim precise recovery when cost is missing.

Resolution: golden scenario `golden-missing-cost-markdown-suppressed` expects campaign review rather than direct markdown action.

## No unsafe rewrites

No production SQL behavior was silently rewritten. No applied migration was modified.
