Next Task:
Release Phase 2 M2.0-M2.6 and stop.

Required release steps:

1. Run full local validation:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run security`
   - `npm run build`
2. Confirm hosted Phase 2 schema verification:
   - `node scripts/security/live-phase2-hosted-schema.ts`
3. Open a PR for `phase-2-m0-m6-merchandising-planning`.
4. Confirm CI and Vercel preview pass.
5. Merge the accepted PR into `main`.
6. Confirm production deployment is ready.
7. Smoke affected production routes:
   - `/login`
   - `/merchandising`
   - `/merchandising/productivity`
   - `/merchandising/performance`
   - `/merchandising/recommendations`
   - `/merchandising/markdowns`
   - `/merchandising/plans`
8. Inspect runtime errors where Vercel tooling permits it.
9. Record deployment evidence.

Stop after M2.6. Do not start M2.7, Phase 3, POS, payments, finance/accounting, wholesale, advanced forecasting, autonomous Copilot execution, or store-operations expansion without explicit phase promotion.
