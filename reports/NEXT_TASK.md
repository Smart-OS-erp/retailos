Next Task:
Milestone 8 — Release-readiness closeout:
- Keep the deployed RetailOS app protected until production governance is accepted.
- Decide whether to accept the current Supabase hosted confirmation email behavior for this non-production demo or configure custom SMTP/an eligible Supabase plan for the token-hash template. Do not paste SMTP credentials into chat.
- Reconcile Supabase migration history before a later CLI `db push`; the reviewed Phase 0 SQL has been applied through SQL Editor, and `supabase/repair_migration_history.sql` now provides a SQL Editor fallback if the preferred CLI repair flow is unavailable.
- If any hosted database setting changes, rerun `npm run test:live-phase0-schema` and `npm run test:live-supabase`.
- Before real tenant or personal data, name privacy/legal, retention/deletion, incident-response, environment, backup, rollback, MFA/recovery, and monitoring owners.

Verified:
- PR #4 and PR #5 are merged.
- Vercel deployments for the preview and main are READY.
- Hosted Phase 0 schema verification passes.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- User-reported hosted setup/onboarding is successful after the location code-normalization fix.

Do not start Phase 0.5 or future-phase work until Phase 0 is explicitly accepted and the active phase changes.
