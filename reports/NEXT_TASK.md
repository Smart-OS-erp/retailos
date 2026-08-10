Next Task:
Stop after Phase 2B M2.7-M2.9.

Autonomy:
The command `continue autonomously` remains valid for already-approved canonical milestones, but the current instruction is to stop after M2.9.

Approved Work:
1. M2.7 - Repository Governance and Release Discipline.
2. M2.8 - Harness Simplification and Product Reconciliation.
3. M2.9 - Senior SWE Codebase Readiness Review.

Required Outcomes:
- M2.7-M2.9 have been implemented and are conditionally accepted pending independent reviewer certification.
- Do not begin the next product milestone until this review boundary is explicitly cleared.

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
Stop after M2.9. Do not begin M2.11, Phase 2C, Phase 3, purchasing, WMS, omnichannel, POS, finance, wholesale, payments, or other new product modules without explicit approval.
