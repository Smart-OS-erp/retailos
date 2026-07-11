Next Task:
Milestone 8 — Hosted verification and protected preview:
- Redeploy preview after the onboarding code-normalization fix, then verify a real user can enter uppercase location codes such as `LAG-LEK` and continue to Brands without a location save error.
- Verify completed/current onboarding steps are navigable from the setup stepper and that the Location/Brands pages expose a safe back path.
- Verify fresh email signup confirmation on the protected preview with a real inbox; the branch `/auth/confirm` callback is now allowlisted in Supabase.
- Resolve or explicitly accept the hosted email-template limitation before preview acceptance.
- Reconcile Supabase migration history before a later CLI `db push`.
- Keep rerunning `npm run test:live-phase0-schema` and `npm run test:live-supabase` after any hosted database change.
- Do not merge/accept the preview PR until remaining release blockers are resolved or explicitly accepted.
- Keep the Vercel preview protected.
- Do not deploy to production without explicit approval.

Foundation release blockers remain tracked in `reports/OPEN_BLOCKERS.md` and must be cleared before preview acceptance.

Do not start Phase 0.5 or future-phase work.
