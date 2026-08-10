Project: RetailOS
Active Phase: Phase 2B - Engineering Reconciliation, Domain Validation and Pilot Readiness
Current Approved Milestones: M2.7-M2.11
Current Mode: Pre-M2.12 technical closure; M2.12 not started
Build Status: M2.11 accepted; hosted synthetic Aso demo provisioned; no new product modules

Canonical Sources:
- harness/roadmap.yaml
- harness/milestones.yaml
- harness/quality-gates.yaml
- harness/human-gates.yaml

Verified Product State:
- Phase 0 M0.20 Aso Collective dataset is accepted as an INTERIM_DOMAIN_BASELINE.
- Phase 0 M0.21 is CONDITIONALLY_ACCEPTED.
- Phase 1 inventory core exists and was deployed.
- Phase 2A M2.0-M2.6 light merchandising intelligence/planning exists and was deployed.
- M2.10 Retail Operating Model v0.9 is already satisfied by M0.20 evidence and was not recreated.
- M2.11 Aso Inventory + Merchandising Dataset Expansion is accepted with versioned synthetic fixtures.

Open Phase 0 Conditions:
- Authenticated browser acceptance closed for the hosted synthetic Aso workflow on 2026-08-10.
- Authenticated production synthetic workflow closed for the hosted synthetic Aso workflow on 2026-08-10.
- Supabase CLI migration-history/reset verification incomplete due target-project CLI access and missing local Docker/Podman.
- Original consultant review pending.
- Real retailer pilot pending.

Current Phase 2B Scope:
- M2.7 - Repository Governance and Release Discipline: accepted after independent review.
- M2.8 - Harness Simplification and Product Reconciliation: accepted after independent review.
- M2.9 - Senior SWE Codebase Readiness Review: accepted after independent review.
- M2.11 - Aso Inventory + Merchandising Dataset Expansion: accepted.

Explicit Non-Scope:
- Do not begin M2.12 or later in this campaign.
- Do not build Phase 2C, Phase 3, purchasing, WMS, omnichannel, POS, finance, wholesale, payments, or other new product modules.
- Do not change repository visibility.

Production Baseline:
- Production URL: https://retailos-ten.vercel.app
- Latest inspected production deployment: dpl_bggBQ7SmTeTymHkacYpqiBS1LNSp
- Deployment status at Phase 2B start: Ready

Hosted Aso Demo:
- URL: https://retailos-ten.vercel.app
- Organization: Aṣọ Collective
- Dataset: ASO_MERCHANDISING_PILOT_V3
- Verification: npm run demo:hosted:verify and npm run demo:hosted:browser passed on 2026-08-10.

Next Required Step:
- Stop after M2.11. M2.12 requires original consultant or approved independent domain-review evidence.
