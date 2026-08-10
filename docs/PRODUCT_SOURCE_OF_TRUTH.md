# Product Source of Truth

## Product promise

RetailOS is a secure operating system for African fashion retail. It converts fragmented operational records into trustworthy, explainable decisions while preserving tenant ownership, user permissions, and auditability.

## Active product outcome

The active campaign is Phase 2B - Engineering Reconciliation, Domain Validation and Pilot Readiness.

The approved Phase 2B milestones completed in the current campaign are:

- M2.7 - Repository Governance and Release Discipline.
- M2.8 - Harness Simplification and Product Reconciliation.
- M2.9 - Senior SWE Codebase Readiness Review.
- M2.11 - Aso Inventory + Merchandising Dataset Expansion.

The historical Phase 0.5 label remains represented in migrations, reports, and docs for development history. Its capabilities are now treated as Phase 0 integration and data-foundation milestones. This is a roadmap reconciliation, not a claim that the work was rebuilt.

M0.20 is accepted. M0.21 is conditionally accepted. M2.10 Retail Operating Model v0.9 is satisfied by M0.20 evidence and remains at `INTERIM_DOMAIN_BASELINE`. M2.12 is the next milestone and requires original consultant or approved independent domain-review evidence.

## Product principles

- Trust before novelty: show provenance, freshness, confidence, and limitations.
- Wedge before end state: inventory recovery intelligence is the initial wedge, not the final product boundary.
- Recovery before expansion: unlock value from existing inventory before adding broad platform surface area.
- Tenant ownership: organizations control their data and access.
- Explainable intelligence: every conclusion must be traceable to permitted inputs and business rules.
- Local operating reality: account for locations, currencies, channels, unreliable connections, and human approval workflows.
- Progressive capability: future phases build on secure foundations without leaking into the active scope.
- Shared OS kernel: future modules must reuse shared identity, tenant isolation, permissions, policy, approvals, workflow state, audit, provenance, event/job, task/attention, and business-rule versioning primitives when they become real.
- Country-aware core: country, currency, locale, timezone, pricing mode, tax mode/configuration, operating calendar, and location semantics must remain core-capable even before POS/fiscal features are approved.
- Planning/execution boundary: merchandise planning recommendations do not execute purchasing, supplier, physical inventory, price, or external-system changes.
- Validation gates expansion: synthetic Aso data proves internal engineering consistency only; real retailer/product evidence gates broad expansion.
- Optional network expansion: Phase 12 retail network/embedded services remain optional, not inevitable.

## Interim domain baseline

`docs/domain/RETAIL_OPERATING_MODEL_V0_9.md` is the interim product baseline for African fashion retail operating rules pending original consultant review and real retailer pilot validation.

## Authority order

When documents disagree, use this order:

1. `harness/roadmap.yaml`.
2. `harness/milestones.yaml`.
3. `harness/quality-gates.yaml`.
4. `harness/human-gates.yaml`.
5. `reports/CURRENT_STATE.md`.
6. `reports/NEXT_TASK.md`.
7. `reports/OPEN_BLOCKERS.md` and `reports/RECENT_FAILURES.md`.
8. Git, migration, deployment, runtime, and validation evidence.
9. `AGENTS.md` for implementation and security constraints.
10. This document for product intent.
11. Specialized business, intelligence, security, and design documents.

Contradictions must be reconciled when safe and clearly supported by repository evidence. If reconciliation requires a commercial, legal, product-owner, destructive, or consultant decision, stop and report the blocker.

## Roadmap boundary

Future phases are context, not blanket implementation authority. Do not start M2.12, Phase 2C, Phase 3, purchasing, WMS, finance, omnichannel, POS, payments, external-system write-back, or later-platform work unless the active milestone explicitly authorizes it.
