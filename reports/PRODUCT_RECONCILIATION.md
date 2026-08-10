# Product Reconciliation Report

Date: 2026-08-10

## Decision

Phase 2B is the active approved campaign. M2.7-M2.11 are accepted. Pre-M2.12 technical closure may resolve technical evidence gaps, hosted synthetic-demo evidence, rule parity, and documentation drift, but it must not mark M2.12 accepted.

## Canonical product state

- Phase 0 — Retail Intelligence, Data and Integration Foundation: `CONDITIONALLY_ACCEPTED`.
- Phase 1 — Core Inventory Operating System: implementation exists and was deployed.
- Phase 2A — Light Merchandising Intelligence and Action Planning: M2.0-M2.6 exists and was deployed.
- Phase 2B — Engineering Reconciliation, Domain Validation and Pilot Readiness: M2.7-M2.11 accepted; M2.12 remains gated by domain review.
- Phase 2C and later phases: not started and not approved for implementation.

## Historical mapping

Historical `Phase 0.5` remains in migration filenames and milestone reports. It now maps to Phase 0 integration/data-foundation history and must not create a conflicting current roadmap branch.

## M2.10 reconciliation

M2.10 Retail Operating Model v0.9 is already satisfied by M0.20 evidence:

- `docs/domain/RETAIL_OPERATING_MODEL_V0_9.md`
- `reports/M0_20_ACCEPTANCE_EVIDENCE.md`
- `docs/demo/ASO_COLLECTIVE_DATASET.md`

The validation level remains `INTERIM_DOMAIN_BASELINE`. It is not original consultant confirmation, pilot validation, customer validation, or commercial proof.

## Contradictions removed

- README no longer says M0.20 is active.
- README now identifies `ASO_MERCHANDISING_PILOT_V3` as the latest Aso dataset while preserving V1 → V2 → V3 lineage.
- OPEN_BLOCKERS no longer says M0-UI is the next milestone.
- AGENTS no longer duplicates a stale full roadmap.
- Phase 2B now has canonical milestone definitions in `harness/milestones.yaml`.

## Strategic product doctrine

The machine-readable roadmap now records the founder-approved invariants:

- inventory recovery intelligence is the initial wedge, not the final product scope;
- future modules must extend the shared OS kernel instead of reinventing identity, tenant isolation, permissions, policy, approvals, workflow state, audit, provenance, events/jobs, attention/tasks, and rule versioning;
- country, currency, locale, timezone, tax/pricing mode, operating calendar, and location semantics belong in the core;
- planning recommendations do not execute purchasing, supplier, physical inventory, price, or external-provider actions;
- synthetic Aso data validates engineering consistency only and does not replace retailer/product validation;
- Phase 12 network/embedded-services expansion is optional.

## Remaining product gates

- Authenticated browser acceptance incomplete until proven with real logged-in Aso content.
- Authenticated production synthetic workflow incomplete until proven with hosted synthetic Aso tenant evidence.
- Original consultant review pending.
- Real retailer pilot pending.
- M2.12 and later require explicit approval and required domain/human evidence after M2.11.
