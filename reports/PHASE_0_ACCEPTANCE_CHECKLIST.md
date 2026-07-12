# Phase 0 Acceptance Checklist

## Current decision status

Status: Phase 0 accepted for transition to Phase 0.5 by founder instruction on 2026-07-12.

Environment: protected non-production Vercel deployment backed by the approved `retailos-dev` Supabase project.

Repository state: PR #4, PR #5, PR #6, PR #7, and PR #8 are merged into `main`.

Phase control: `reports/CURRENT_STATE.md` declares `Phase 0.5 — Integration Hub MVP`. Do not start Phase 1 or future-phase implementation until a later human-approved phase change is committed.

## Verified protected-demo evidence

- Hosted signup and email confirmation have been exercised by the user.
- Hosted setup/onboarding has been exercised successfully by the user after the location code-normalization fix.
- Vercel deployments for merged Phase 0 work have reached READY.
- Hosted Supabase Phase 0 schema verification passes.
- Hosted Supabase Auth, onboarding, audit visibility, RBAC denial, anonymous denial, and two-tenant RLS verification pass.
- Supabase migration history is repaired for the seven applied Phase 0 migrations.
- No service-role key is exposed in browser code by the current security scanners.
- The app remains protected until production governance is accepted.

## Decision 1 — Hosted email confirmation

Chosen path for protected non-production demo: Option A.

### Option A — Accept current hosted confirmation behavior for the protected demo

This is acceptable only if all conditions remain true:

- The deployment stays protected.
- The environment remains non-production.
- Test users understand that the hosted Supabase confirmation email body may differ from the committed token-hash template.
- No real tenant data, customer data, employee data, or production secrets are entered.
- The limitation remains documented as a production-governance follow-up.

Acceptance record:

- Decision owner: founder/environment owner, approved by user instruction in Codex thread
- Decision date: 2026-07-12
- Approved scope: protected non-production demo only
- Decision: accepted current Supabase hosted confirmation email behavior for the protected non-production demo
- Required follow-up before production: custom SMTP/eligible plan decision, email-link replay/expiry testing, and production governance approval

### Option B — Configure custom SMTP or eligible Supabase plan

Use this path if the committed token-hash template must be active before continued demo testing.

Rules:

- Do not paste SMTP credentials, Supabase service-role keys, database URLs, or provider secrets into chat.
- Configure credentials only through approved secret-management surfaces.
- Keep production credentials out of the non-production project.
- Rerun hosted signup, valid-link, invalid-link, expired-link, and replayed-link tests after configuration.
- Rerun `npm run test:live-phase0-schema` and `npm run test:live-supabase` if any hosted Supabase setting changes.

Acceptance record:

- Environment owner: TODO
- Configuration date: TODO
- Evidence link or location: TODO
- Retest commands/results: TODO

## Decision 2 — Production governance owners

Production governance was accepted by founder instruction in the Codex thread on 2026-07-12. The founder/environment owner remains accountable for any control area without a separately named delegate in the repository.

| Control area | Required owner/action | Status |
| --- | --- | --- |
| Privacy/legal | Name accountable owner for privacy policy, data processing basis, tenant terms, and notification requirements. | Accepted by founder/environment owner instruction on 2026-07-12 |
| Retention/deletion | Approve retention windows, deletion process, export process, and audit-log retention. | Accepted by founder/environment owner instruction on 2026-07-12 |
| Incident response | Name incident lead, escalation channel, legal/privacy contact, and customer communication owner. | Accepted by founder/environment owner instruction on 2026-07-12 |
| Environment/secrets | Name owner for Vercel/Supabase environments, secret rotation, and access review. | Accepted by founder/environment owner instruction on 2026-07-12 |
| Backup/restore | Document backup schedule, restore test evidence, and recovery-point/recovery-time expectations. | Accepted by founder/environment owner instruction on 2026-07-12 |
| Rollback | Document rollback path for app releases and database migrations. | Accepted by founder/environment owner instruction on 2026-07-12 |
| MFA/recovery | Approve MFA requirements, emergency access process, and account recovery path for platform admins. | Accepted by founder/environment owner instruction on 2026-07-12 |
| Monitoring/alerting | Name owner for uptime, auth failures, RLS/security anomalies, error tracking, and deployment alerts. | Accepted by founder/environment owner instruction on 2026-07-12 |
| Support/abuse | Name owner for support intake, suspicious signup handling, and tenant-access support boundaries. | Accepted by founder/environment owner instruction on 2026-07-12 |

## Go/no-go state

| Scope | Current state | Rationale |
| --- | --- | --- |
| Protected non-production Phase 0 demo | Accepted with current hosted Supabase confirmation behavior | Core hosted flow and security harnesses pass; email behavior is accepted for protected demo use only. |
| Real tenant or personal data | Accepted by founder instruction | Production governance was accepted in the Codex thread on 2026-07-12. |
| Production launch | Requires separate deployment approval | Governance is accepted, but production deployment still requires normal deployment approval and environment verification. |
| Phase 0.5 | Active | `reports/CURRENT_STATE.md` declares Phase 0.5 as the active phase. |
| Phase 1 or future phases | No-go | Active phase has not changed beyond Phase 0.5. |

## Acceptance instructions

1. Keep Phase 0.5 implementation inside the Integration Hub MVP boundary.
2. Rerun required hosted tests if any hosted Supabase setting changes.
3. Use managed secret stores for real connector credentials; never paste or commit them.
4. Update `reports/CURRENT_STATE.md`, `reports/NEXT_TASK.md`, and `reports/OPEN_BLOCKERS.md` in reviewed PRs as Phase 0.5 milestones complete.
5. Only after Phase 0.5 is explicitly accepted may the active phase be changed for Phase 1 or future work.
