Project: RetailOS
Active Phase: Phase 0 - Foundation: Inventory Recovery Intelligence
Active Milestone: M0.20 - Aso Collective Phase 0 Demo Dataset
Current Mode: Autonomous continuation campaign

Current Production Commit: b70be160a96f30e5a36fe4052c2b191c40700e87
Production Deployment: dpl_BZZu9rv9r9hES2qGLPVozWWNkCTq
Production URL: https://retailos-ten.vercel.app

Roadmap Reconciliation:
- Phase 0 remains the foundational inventory recovery phase.
- The historical Phase 0.5 label is retained in reports and migrations for development history.
- Former Phase 0.5 capabilities are now treated as Phase 0 integration and data-foundation milestones.
- This reconciliation is not a claim that Phase 0.5 work was rebuilt.
- The end of Phase 0 is now:
  - M0.20 - Aso Collective Phase 0 Demo Dataset.
  - M0.21 - Phase 0 End-to-End Acceptance and Hardening.
- M0.21 depends on M0.20.
- The next milestone after M0.21 remains the first incomplete Phase 2B engineering-reconciliation milestone defined by the current roadmap.
- Do not start Phase 2B in this campaign.

Historical Implementation Status:
- Phase 0 secure foundation, data foundation, consolidation, inventory recovery intelligence, projectisation, campaign briefs, tasks, deterministic Copilot, and UI foundation exist.
- Historical Phase 0.5 integration/data-foundation work exists: Integration Hub, Import API, Shopify/WooCommerce MVP workers, scheduled sync, canonical approval flows, and automatic intelligence recalculation evidence.
- Phase 1 inventory core and visible workflow acceptance were merged and deployed.
- Phase 2 M2.0-M2.6 merchandising/planning work was merged and deployed before this roadmap reconciliation.

Current M0.20 Scope:
- Establish the persistent `continue autonomously` command in repository operating instructions.
- Reconcile the roadmap so Phase 0 ends with M0.20 and M0.21.
- Create RetailOS African Fashion Retail Operating Model v0.9.
- Create deterministic synthetic Aso Collective Phase 0 dataset version `ASO_PHASE0_DATASET_V1`.
- Add `demo:seed`, `demo:verify`, `demo:reset`, and `demo:cleanup` commands.
- Use synthetic data only.

Current M0.20 Non-Goals:
- Do not start Phase 2B, Phase 2C, Phase 3, purchasing, WMS, finance, omnichannel, or POS.
- Do not use real retailer data.
- Do not claim original consultant approval.
- Do not claim Phase 0 accepted before M0.21 passes.
- Do not perform destructive production migration or external-system write-back.

Verification Status:
- M0.20 local dataset lifecycle has passed once on this branch: `npm run demo:seed`, `npm run demo:verify`, `npm run demo:reset`, and `npm run demo:cleanup`.
- Full M0.20 local validation passed on this branch: `git diff --check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run security`, `npm run build`, `npm audit --audit-level=moderate`, `npm run demo:seed`, `npm run demo:verify`, `npm run demo:reset`, and `npm run demo:cleanup`.
- PR checks, preview review, merge, production deployment, and production evidence remain pending for M0.20.

Database Migration Status:
- Repository contains migrations through Phase 2 M2.6.
- No new M0.20 database migration is planned; the dataset is repository-stored synthetic fixture data and local ignored seed state.
- Supabase CLI migration-history/reset remains unverified in this shell.

Next Required Milestone:
- Complete M0.20, then proceed to M0.21 only after M0.20 passes completely.
