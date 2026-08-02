Project: RetailOS
Active Phase: Phase 2 - Merchandising & Planning OS
Active Milestone: M2.6 - Phase 2 validation evidence and acceptance

Current Production Commit: fd35afb3418c1c1e920ebe74796576c84adffd23
Production Deployment: dpl_CzeC5JyAYJZegKAoLkBAvRWk6Xpc
Production URL: https://retailos-ten.vercel.app

Implementation Status:
- Phase 1 visible workflow acceptance was merged in PR #44 and deployed to production on July 18, 2026.
- Production route smoke after PR #44 passed for `/login`, `/inventory`, `/inventory/counts`, `/inventory/search`, and `/inventory/watchlist`.
- Post-smoke Vercel error-log inspection found no errors in the inspected window.
- Human approval to promote into Phase 2 and stop at M2.6 was given in chat.
- Phase 2 M2.0-M2.6 was merged through PR #45 and PR #46 and deployed to production on August 2, 2026.

Phase 2 M2.0-M2.6 Scope Implemented:
- M2.0: merchandising scope, role permissions, navigation, secure data contracts, and docs.
- M2.1: `product_productivity_metrics` historical read model from persisted inventory, sales, and risk evidence.
- M2.2: `merchandising_group_performance` brand/category/collection read model.
- M2.3: markdown planning drafts from converted recommendations; drafts do not execute prices or promotions.
- M2.4: merchandising planning cycles and assortment plan items; approval records the plan but does not execute buying, transfers, supplier, or warehouse workflows.
- M2.5: permissioned recommendation generation with confidence labels and no automatic execution.
- M2.6: integration evidence, hosted schema verification, acceptance matrix, and updated harness gates.

Verification Status:
- Focused Phase 2 integration validation passed: 7 files passed, 52 tests passed.
- `npm run typecheck` passed after Phase 2 UI/type wiring.
- Full Phase 2 release validation passed locally: `npm run lint`, `npm run typecheck`, `npm run security`, `npm run test`, `npm run build`, and `npm audit --audit-level=moderate`.
- Hosted Supabase migration `20260718213000_phase2_merchandising_planning_m0_m6.sql` was applied or reconciled without printing secrets.
- `node scripts/security/live-phase2-hosted-schema.ts` passed for 8 required relations/views and 5 required functions.
- GitHub PR checks passed for PR #46: Quality, Security foundation checks, Vercel preview, and Vercel Preview Comments.
- Production deployment `dpl_CzeC5JyAYJZegKAoLkBAvRWk6Xpc` is ready.
- Production route smoke passed without 5xx errors for `/`, `/login`, `/merchandising`, `/merchandising/productivity`, `/merchandising/performance`, `/merchandising/recommendations`, `/merchandising/markdowns`, and `/merchandising/plans`.
- Vercel production error-log inspection found no error logs in the inspected 10-minute window.

Database Migration Status:
- Repository contains Supabase migrations through Phase 2 M2.6.
- Phase 2 hosted SQL application succeeded on July 18, 2026.
- Supabase CLI is not installed in this shell, so `supabase migration list`, `supabase db reset`, and CLI migration-history reconciliation remain unverified.
- No destructive production database operation was performed.

Current Mode:
- Stop at M2.6. Do not continue to M2.7, Phase 3, POS, payments, finance/accounting, wholesale, advanced forecasting, autonomous Copilot execution, or workforce/store-operations expansion.
- Do not ask users to paste secrets into chat or browser forms.
- Phase 2 recommendations are directional and evidence-backed; they must not be presented as predictive precision.

Next Required Milestone:
- Hold at M2.6. A human must explicitly approve the next milestone before any post-M2.6 work begins.
