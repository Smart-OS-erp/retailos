# Phase 0 Acceptance Checklist

## Current decision status

Status: Ready for founder and environment-owner review, not approved for real tenant or personal data.

Environment: protected non-production Vercel deployment backed by the approved `retailos-dev` Supabase project.

Repository state: PR #4, PR #5, PR #6, and PR #7 are merged into `main`.

Phase control: `reports/CURRENT_STATE.md` still declares `Phase 0 — Foundation: Inventory Recovery Intelligence`. Do not start Phase 0.5 or future-phase implementation until a human-approved phase change is committed.

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

Choose one path before real tenant or personal data.

### Option A — Accept current hosted confirmation behavior for the protected demo

This is acceptable only if all conditions remain true:

- The deployment stays protected.
- The environment remains non-production.
- Test users understand that the hosted Supabase confirmation email body may differ from the committed token-hash template.
- No real tenant data, customer data, employee data, or production secrets are entered.
- The limitation remains listed in `reports/OPEN_BLOCKERS.md`.

Acceptance record:

- Decision owner: TODO
- Decision date: TODO
- Approved scope: protected non-production demo only
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

RetailOS must not process real tenant or personal data until these owners and controls are named.

| Control area | Required owner/action | Status |
| --- | --- | --- |
| Privacy/legal | Name accountable owner for privacy policy, data processing basis, tenant terms, and notification requirements. | TODO |
| Retention/deletion | Approve retention windows, deletion process, export process, and audit-log retention. | TODO |
| Incident response | Name incident lead, escalation channel, legal/privacy contact, and customer communication owner. | TODO |
| Environment/secrets | Name owner for Vercel/Supabase environments, secret rotation, and access review. | TODO |
| Backup/restore | Document backup schedule, restore test evidence, and recovery-point/recovery-time expectations. | TODO |
| Rollback | Document rollback path for app releases and database migrations. | TODO |
| MFA/recovery | Approve MFA requirements, emergency access process, and account recovery path for platform admins. | TODO |
| Monitoring/alerting | Name owner for uptime, auth failures, RLS/security anomalies, error tracking, and deployment alerts. | TODO |
| Support/abuse | Name owner for support intake, suspicious signup handling, and tenant-access support boundaries. | TODO |

## Go/no-go state

| Scope | Current state | Rationale |
| --- | --- | --- |
| Protected non-production Phase 0 demo | Ready for explicit acceptance after Decision 1 is recorded | Core hosted flow and security harnesses pass. |
| Real tenant or personal data | No-go | Governance owners and production controls are not yet approved. |
| Production launch | No-go | Email confirmation, governance, monitoring, backup/restore, rollback, and privacy/legal controls remain open. |
| Phase 0.5 or future phases | No-go | Active phase has not changed and Phase 0 is not formally accepted. |

## Acceptance instructions

1. Pick Decision 1, Option A or Option B.
2. Fill the relevant acceptance record above without adding secrets.
3. Fill the production governance owner table before any real data enters RetailOS.
4. Rerun required hosted tests if any hosted Supabase setting changes.
5. Update `reports/CURRENT_STATE.md`, `reports/NEXT_TASK.md`, and `reports/OPEN_BLOCKERS.md` in a reviewed PR.
6. Only after Phase 0 is explicitly accepted may the active phase be changed for the next approved scope.
