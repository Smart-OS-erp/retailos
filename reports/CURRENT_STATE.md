Project: RetailOS
Active Phase: Phase 1 - Core Inventory Operating System
Active Milestone: Phase 1 Visible Workflow Verification and Acceptance

Current Production Commit: 478db13070f5504ef5291374556a1751c7591280
Production URL: https://retailos-ten.vercel.app

Implementation Status:
- Phase 0 foundation routes, onboarding, data intake, validation, consolidation, inventory recovery, projectisation, deterministic Copilot, and workspaces exist in code.
- Phase 0.5 Integration Hub setup UI, data-source RPCs, Import API route, Import API credential/control-plane, external-record storage, sync jobs/errors, normalization handoff, provider MVP promotion, Shopify MVP worker, provider credential onboarding, WooCommerce MVP worker, scheduled sync worker, canonical write approval flows, automatic intelligence recalculation evidence, and M0-UI shared frontend foundation exist in `main`.
- Human approval to promote to Phase 1 was given in chat before Phase 1 work began.
- Phase 1 Inventory Core Foundations M1-M5 were merged in PR #39 and deployed.
- Phase 1 Inventory Operations Core M6 was merged in PR #42 and its hosted migration was applied or reconciled on July 18, 2026.
- Phase 1 M1.9 Inventory Operating System Completion was merged in PR #43 and deployed to production commit `478db13070f5504ef5291374556a1751c7591280`.
- This branch adds Phase 1 visible workflow acceptance hardening: user-saved inventory watchlist add/remove, hosted schema coverage for the saved watchlist, a live Phase 1 workflow smoke test, and acceptance evidence.

Verification Status:
- Focused Phase 1 integration validation passed: 6 files passed, 49 tests passed.
- Local lint and typecheck passed for the acceptance slice.
- Hosted Supabase migration `20260718210000_phase1_visible_workflow_acceptance.sql` was applied or reconciled without printing secrets.
- Hosted Phase 1 schema verification passed for 15 required relations/views and 16 required functions.
- Live Phase 1 synthetic workflow smoke passed against hosted Supabase and cleaned up its synthetic tenant/users. Covered workflows: inventory search, saved watchlist add/remove, adjustment execute/reverse, transfer partial/full receipt, stock-count close/correction, role/location denial, and audit events.
- Phase 1 final status: CONDITIONALLY ACCEPTED pending post-merge production route smoke for this acceptance branch and Supabase CLI migration-history/reset verification.

Database Migration Status:
- Repository contains Supabase migrations from secure foundation through Phase 1 visible workflow acceptance.
- Phase 1 foundation migration `20260718093000_phase1_inventory_core_foundations.sql` was applied to hosted Supabase on July 18, 2026.
- Phase 1 M6 migration `20260718103000_phase1_inventory_operations_core.sql` was applied or reconciled to hosted Supabase on July 18, 2026.
- Phase 1 M1.9 migration `20260718120000_phase1_m1_9_inventory_completion.sql` was applied or reconciled to hosted Supabase on July 18, 2026.
- Phase 1 visible workflow acceptance migration `20260718210000_phase1_visible_workflow_acceptance.sql` was applied or reconciled to hosted Supabase on July 18, 2026.
- Supabase CLI is not installed in this shell, so `supabase migration list`, `supabase db reset`, and CLI migration-history reconciliation remain unverified.
- No destructive production database operation is authorized or performed.

Known Runtime Issues:
- Earlier production Import API failures were caused by invalid Production `DATABASE_URL` values: DNS lookup failures and password authentication failure for user `postgres`.
- Resolution: Production `DATABASE_URL` was replaced from ignored local secret management, production was redeployed, and fresh Import API smoke passed.
- Phase 1 acceptance live smoke initially passed its workflows but cleanup missed `event_log`; the script now deletes synthetic `event_log` rows before locations and rerun cleanup passed.

Current Mode:
- Phase 1 visible workflow acceptance is being prepared for PR.
- The founder/user has explicitly approved continuing milestone-by-milestone into Phase 2 and stopping at M2.6 after Phase 1 acceptance is recorded.
- Do not ask users to paste secrets into chat or browser forms.
- Do not store provider access tokens in `data_sources.connection_metadata`, client code, fixtures, screenshots, docs, or Git.
- Do not add POS, finance/accounting, wholesale, marketplace publishing, autonomous campaign execution, or real LLM agent execution in this slice.

Next Required Milestone:
- Merge the Phase 1 acceptance PR, verify production deployment, smoke affected production routes, then promote `reports/CURRENT_STATE.md` to Phase 2 and execute Phase 2 milestones sequentially through M2.6 only.
