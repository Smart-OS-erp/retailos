Next Task:
Stop before Phase 2B M2.12 domain validation.

Autonomy:
The command `continue autonomously` remains valid for already-approved canonical milestones, but the current instruction is to stop after M2.11.

Approved Work:
1. M2.7 - Repository Governance and Release Discipline.
2. M2.8 - Harness Simplification and Product Reconciliation.
3. M2.9 - Senior SWE Codebase Readiness Review.
4. M2.11 - Aso Inventory + Merchandising Dataset Expansion.

Required Outcomes:
- M2.7-M2.9 have been independently reviewed and accepted.
- M2.11 has been implemented and accepted.
- Pre-M2.12 technical closure has provisioned a hosted synthetic Aso demo and strengthened rule/drift evidence.
- Do not begin M2.12 without the required domain/human evidence.

Mandatory Validation:
- git diff --check
- npm run harness:validate
- npm run lint
- npm run typecheck
- npm run test
- npm run test:unit
- npm run test:integration
- npm run test:security
- npm run security
- npm run build
- npm audit --audit-level=moderate

Aso Dataset Validation:
- Run demo seed/verify/reset/cleanup only if dataset files or dataset logic change.

Stop Rule:
Stop after M2.11. Do not begin M2.12, Phase 2C, Phase 3, purchasing, WMS, omnichannel, POS, finance, wholesale, payments, or other new product modules without explicit approval.

Exact Next Milestone:
M2.12 - Retail Domain Validation.

Required Before M2.12 Acceptance:
- Original consultant or approved independent domain reviewer evidence.
- Review of Retail Operating Model v0.9 assumptions.
- Review of Aso V2/V3 scenarios and golden outcomes.
- Explicit classification of findings as formula verified, internally validated, interim baseline, original consultant confirmed, pilot validated, or customer validated.
