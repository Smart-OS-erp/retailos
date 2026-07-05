# Supabase Security

## Database

- Enable and test RLS for every tenant table before access.
- Revoke unnecessary grants from `anon`, `authenticated`, and public roles.
- Keep ownership and service roles out of browser paths.
- Pin function `search_path`, review security-definer functions, and avoid dynamic SQL where possible.
- Use constraints and tenant-aware relationships to support policy correctness.
- Treat views, RPC, realtime, extensions, and database webhooks as separate exposure surfaces.

## Auth and Storage

- Restrict redirect URLs and providers by environment; configure abuse controls and email flows.
- Use private buckets and policies aligned with database membership and tenant paths.
- Verify signed URL duration and authorization at issuance.

## Operations

- Separate environments and credentials.
- Apply migrations through reviewed automation, not ad hoc production edits.
- Enable appropriate logs and alerts without sensitive payload leakage.
- Review backups, point-in-time recovery, retention, and restore tests.
- Run advisor/scanner findings and resolve material issues before release.

Supabase configuration must be captured as code or documented evidence; dashboard state alone is not reproducible.
