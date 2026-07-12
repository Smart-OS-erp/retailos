# Secure Technical Foundation Validation

Date: 2026-07-05

Branch: `secure-technical-foundation`

## Scope

Next.js/Supabase scaffold, Auth session boundaries, organizations, memberships, RBAC, forced RLS, atomic onboarding, audit events, and security tests. No dashboard, inventory intelligence, upload, integration, or future-phase feature is included.

## Local results

| Command | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | Pass — 4 files, 15 tests |
| `npm run security` | Pass |
| `npm run build` | Pass — Next.js 16.2.10 production build |
| `npm audit --audit-level=moderate` | Pass — 0 vulnerabilities |
| `git diff --check` | Pass |
| GitHub CI on Node 22 | Pass — Quality and Security jobs |

## Security evidence

- Public/server environment boundaries are lazy and separate; no value is logged by validation.
- Browser import-graph scanning finds no path to `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL`.
- Protected onboarding pages/actions call server-side identity verification.
- All public foundation tables enable and force RLS.
- Direct tenant-table privileges are explicitly revoked before minimal grants.
- PGlite PostgreSQL tests verify two-tenant select/update isolation, owner/viewer role differences, suspended/no-membership denial, anonymous denial, membership-write denial, repeat-onboarding denial, and tenant-scoped audit visibility.

## Not verified

- The migration has not been applied to the user's Supabase project.
- Supabase Auth callback/template configuration has not been exercised.
- Live RLS, expiry/revocation, rate controls, Vercel environment scope, preview deployment, observability, backup, and rollback evidence are not available.
- Local validation used Node 26.3.0; GitHub CI reproduced the quality and security gates on the repository-pinned Node 22 runtime.

These items are release blockers, not silently passed gates.

## Subsequent non-production evidence

After this original foundation report, the reviewed migration was applied to `retailos-dev` and `npm run test:live-supabase` passed synthetic Auth, atomic onboarding, audit, RBAC, anonymous denial, and two-tenant RLS checks with cleanup. Confirm-email signups, an eight-character minimum password, and exact local callback URLs were also verified.

Vercel Git linkage, protected preview verification, hosted setup/onboarding, hosted schema/RLS checks, and Supabase migration-history repair were completed in later Phase 0 closeout work. Current hosted Supabase confirmation behavior is accepted for the protected non-production demo only; hosted token-hash template activation remains a production-governance follow-up if required. See `reports/CURRENT_STATE.md` and `reports/OPEN_BLOCKERS.md` for current authority.
