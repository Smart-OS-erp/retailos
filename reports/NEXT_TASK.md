Next Task:
Milestone 8 — Hosted verification and protected preview:
- Apply missing Phase 0 migrations to the non-production Supabase project without exposing secrets.
- Generate the reviewed SQL handoff with `npm run migration:hosted-bundle` if SQL Editor/CLI access is available outside this workspace.
- Add the protected preview `/auth/confirm` URLs to the Supabase Auth redirect allowlist before retrying signup.
- Run live Supabase tenant-isolation verification and authenticated app smoke tests after migrations are applied.
- Keep PR #4 as draft until hosted database verification passes.
- Keep the Vercel preview protected.
- Do not deploy to production without explicit approval.

Foundation release blockers remain tracked in `reports/OPEN_BLOCKERS.md` and must be cleared before preview acceptance.

Do not start Phase 0.5 or future-phase work.
