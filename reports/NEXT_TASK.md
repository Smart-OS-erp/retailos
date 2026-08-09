Next Task:
Complete M0.21 - Phase 0 End-to-End Acceptance and Hardening.

Autonomous Continuation:
- The persistent repository command is `continue autonomously`.
- Future sessions must use that command to resolve and progress the next eligible milestone automatically until a mandatory stop condition is reached.

Dependency Status:
- M0.20 - Aso Collective Phase 0 Demo Dataset is released and production-smoked.

Required M0.21 Steps:
1. Create a fresh branch from updated `main`.
2. Implement Phase 0 end-to-end acceptance tests and hardening using `ASO_PHASE0_DATASET_V1`.
3. Verify the complete journey:
   - raw synthetic source data;
   - upload or import;
   - schema validation;
   - row validation;
   - correction;
   - SKU identity resolution;
   - canonical approval;
   - consolidation;
   - operating view;
   - freshness and confidence;
   - inventory aging;
   - risk calculation;
   - Attention Queue;
   - recovery opportunity;
   - ranked recovery action;
   - recovery project;
   - approval where supported;
   - campaign brief;
   - tasks;
   - Copilot explanation.
4. Create:
   - `reports/PHASE_0_ACCEPTANCE_MATRIX.md`
   - `reports/PHASE_0_ACCEPTANCE_EVIDENCE.md`
   - `reports/PHASE_0_FINAL_DECISION.md`
5. Run full validation and demo lifecycle.
6. Open PR, wait for checks, review preview, merge when allowed, verify production, and record evidence.

Final Phase 0 Decision Values:
- `PHASE_0_ACCEPTED`
- `PHASE_0_CONDITIONALLY_ACCEPTED`
- `PHASE_0_NOT_ACCEPTED`

Stop Conditions:
- Do not start Phase 2B, Phase 2C, Phase 3, purchasing, WMS, finance, omnichannel, or POS in this campaign.
- Stop if M0.21 requires destructive production migration, missing secret, original consultant approval, real retailer pilot acceptance, paid-plan decision, legal decision, high/critical security issue, failed tenant isolation, failed production smoke, or migration-history conflict.
