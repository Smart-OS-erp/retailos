# Product Source of Truth

## Product promise

RetailOS is a secure operating system for African fashion retail. It converts fragmented operational records into trustworthy, explainable decisions while preserving tenant ownership, user permissions, and auditability.

## Active product outcome

The active phase is Phase 0 — Foundation: Inventory Recovery Intelligence. Its intended outcome is to help an authorized retailer understand where inventory value is trapped, why an item was classified as a recovery opportunity, and what safe next action should be considered.

This repository currently contains only the harness. No inventory feature, recommendation engine, user interface, or production data path exists yet.

## Product principles

- Trust before novelty: show provenance, freshness, confidence, and limitations.
- Recovery before expansion: unlock value from existing inventory before adding broad platform surface area.
- Tenant ownership: organizations control their data and access.
- Explainable intelligence: every conclusion must be traceable to permitted inputs and business rules.
- Local operating reality: account for locations, currencies, channels, unreliable connections, and human approval workflows.
- Progressive capability: future phases build on secure foundations without leaking into the active scope.

## Authority order

When documents disagree, use this order:

1. `reports/CURRENT_STATE.md` for active phase and build mode.
2. `AGENTS.md` for implementation and security constraints.
3. `docs/PHASE_0_SCOPE.md` for active-phase boundaries.
4. This document for product intent.
5. Specialized business, intelligence, security, and design documents.

Contradictions must be recorded in `reports/OPEN_BLOCKERS.md`; agents must not silently choose the broader scope.

## Roadmap boundary

Phases 1–5 are described in `AGENTS.md` only to protect architectural direction. They are not accepted backlog for the active build and must not appear as implemented navigation, APIs, tables, demo data, or screens.
