# Vercel Deployment

This is the deployment contract for the future application scaffold. No Vercel project or deployment is created by this harness.

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

See `docs/security/VERCEL_SECURITY.md` for the platform threat controls.
