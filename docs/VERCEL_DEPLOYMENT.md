# Vercel Deployment

## Current production state

- Project: `retailos`
- Vercel project ID: `prj_t9osWPJzE94M0qYz3e2NMVNeE9vp`
- Team ID: `team_fi0ihj3yuoE9FgMUuAbyy50i`
- GitHub repository: `Smart-OS-erp/retailos`
- Production branch: `main`
- Production URL: `https://retailos-ten.vercel.app`
- Current production commit: `d19a4635d32bfc5b0d26916e3efbd8603e751372`
- Current production deployment: `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`
- Previous rollback candidate: `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZopfE`

## Runtime alignment

`package.json` requires Node `>=22 <23`. During M0-R, the Vercel project Node setting was aligned to `22.x`. Earlier build logs showed Vercel used Node 22 because the package engine overrode a stale project setting of `24.x`.

## Required environment variables

Production requires these names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `IMPORT_API_TOKEN_HASH_SECRET`

Optional provider credentials must remain server-only:

- `SHOPIFY_CONNECTOR_CREDENTIALS_JSON`
- `WOOCOMMERCE_CONNECTOR_CREDENTIALS_JSON`

Do not paste values into chat. Set them directly in Vercel environment settings or through authenticated CLI/API. `DATABASE_URL`, service-role keys, token secrets, and provider credentials must be sensitive/server-only.

## M0-R production repair evidence

Observed failure:

- Deployment `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZopfE`
- Import API smoke returned `500 internal_error`
- Correlation ID `f9424e58-9bad-4b9e-8300-db956923fafa`
- Runtime cause: Postgres `28P01`, password authentication failed for user `postgres`

Resolution:

- Production `DATABASE_URL` was removed and re-added as a sensitive variable from ignored local secret management.
- Production was redeployed as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`.
- Fresh Import API smoke passed.
- `/login` and `/signup` returned 200.
- `/workspace` redirected unauthenticated users to `/login`.
- Post-smoke runtime error/fatal logs for the current deployment were empty in the inspected window.

## Required controls

- Link the intended repository and project explicitly.
- Scope environment variables by environment and keep secrets out of `NEXT_PUBLIC_*`.
- Protect deployments and GitHub production permissions with least privilege and MFA-capable identities.
- Treat previews as externally reachable: no production data, permissive callbacks, debug endpoints, or sensitive logs.
- Run lint, typecheck, tests, build, security, and production smoke gates before promotion.
- Record deployment ID, commit SHA, env-status, runtime logs, and rollback target for every production-affecting milestone.
- Add runtime failures discovered during validation to `reports/RECENT_FAILURES.md`.

See `docs/security/VERCEL_SECURITY.md` for platform threat controls.
