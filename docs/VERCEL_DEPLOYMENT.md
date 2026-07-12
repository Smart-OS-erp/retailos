# Vercel Deployment

This is the deployment contract for the Phase 0 secure technical foundation.

## Current status

- The `retailos` Vercel project is linked to `Smart-OS-erp/retailos`.
- The four required variables are configured for Preview; `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are sensitive, server-only values.
- Production variables are intentionally not populated with non-production credentials.
- Git-linked Vercel deployments for the Phase 0 PRs and merged `main` have reached READY.
- Vercel Authentication protects deployment URLs (`all_except_custom_domains`) and Git fork protection is enabled.
- Production promotion, custom-domain exposure, and real tenant/personal data remain blocked until production governance is approved.
- Earlier CLI deployments that Vercel unexpectedly classified as production targets were removed; use Git-linked deployments for preview verification.

## Environment model

- Local development uses local configuration and a non-production Supabase project.
- Preview deployments use isolated/non-production data and restricted integrations.
- Production uses dedicated secrets, domains, data stores, monitoring, and release approval.

## Required controls

- Link the intended repository and project explicitly; do not infer production targets.
- Scope environment variables by environment and keep secrets out of `NEXT_PUBLIC_*`.
- Protect deployment and GitHub production permissions with least privilege and MFA-capable identities.
- Treat previews as externally reachable: no production data, permissive callbacks, debug endpoints, or sensitive logs.
- Run lint, typecheck, tests, build, and security gates before promotion.
- Define CSP and other security headers in the application, then verify them against the deployed response.
- Preserve deploy and audit logs according to policy without recording secrets or excessive personal data.
- Document rollback and database compatibility before production release.

Do not use a generic CLI deployment for this project until branch targeting is proven. Create previews from connected non-production branches, confirm each target is Preview before sharing a URL, and verify access protection before application smoke tests.

See `docs/security/VERCEL_SECURITY.md` for the platform threat controls.
