Next Task:
Complete M0.20 - Aso Collective Phase 0 Demo Dataset.

Autonomous Continuation:
- The owner command `continue autonomously` is now a persistent repository command.
- Future sessions must resolve the next eligible milestone from the authoritative roadmap and current evidence, then continue automatically until a mandatory human gate or technical stop condition is reached.

Current Authoritative Milestone:
M0.20 - Aso Collective Phase 0 Demo Dataset.

Required M0.20 Steps:
1. Finish operating-model documentation.
2. Finish deterministic Aso Collective dataset fixtures.
3. Run:
   - `npm run demo:seed`
   - `npm run demo:verify`
   - `npm run demo:reset`
   - `npm run demo:cleanup`
4. Run full relevant validation:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run security`
   - `npm run build`
   - `npm audit --audit-level=moderate`
5. Open an M0.20 pull request.
6. Wait for checks and preview deployment.
7. Merge when checks and repository policy permit.
8. Verify production deployment.
9. Record evidence.

Next Milestone:
M0.21 - Phase 0 End-to-End Acceptance and Hardening.

M0.21 Dependency:
M0.20 must pass completely first.

Stop Conditions:
- Do not start Phase 2B, Phase 2C, Phase 3, purchasing, WMS, finance, omnichannel, or POS in this campaign.
- Do not continue if M0.20 validation fails.
- Do not continue if a destructive production migration, missing secret, original consultant approval, real retailer pilot acceptance, paid-plan decision, legal decision, high/critical security issue, failed tenant isolation, failed production smoke, or migration-history conflict is encountered.
