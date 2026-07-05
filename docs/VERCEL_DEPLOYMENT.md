# Vercel Deployment

This is the deployment contract for the Phase 0 secure technical foundation.

## Current status

- The `retailos` Vercel project is linked locally.
- The four required variables are configured for Preview; `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are sensitive, server-only values.
- Production variables are intentionally not populated with non-production credentials.
- No deployment is active. Two CLI attempts were removed after Vercel unexpectedly classified them as production targets.
- Vercel Authentication protects deployment URLs (`all_except_custom_domains`) and Git fork protection is enabled.
- A protected preview remains blocked until the Vercel account completes its GitHub login connection and links `Smart-OS-erp/retailos`.

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

Do not use a generic CLI deployment for this project until branch targeting is proven. Create the next preview from the connected non-production branch, confirm its target is Preview before sharing a URL, and verify access protection before application smoke tests.

See `docs/security/VERCEL_SECURITY.md` for the platform threat controls.
