# Open Blockers

## Release blockers

- **Remote migration not applied.** Owner/action: apply the reviewed migration to a non-production Supabase project and retain migration output.
- **Supabase Auth not verified.** Owner/action: configure allowed site/callback URLs and the token-hash confirmation email template, then test sign-up, confirmation, sign-in, sign-out, expiry, and invalid links.
- **Live tenant isolation not verified.** Owner/action: run the two-tenant allow/deny matrix through Supabase's authenticated role after migration.
- **Preview environment not verified.** Owner/action: scope all four variables in Vercel without exposing server-only values, deploy a protected preview, and run smoke/security checks.

## Production governance blockers

- Name privacy/legal, retention/deletion, incident-response, and environment owners before real tenant or personal data.
- Approve MFA/recovery policy, monitoring/alerting, backups, restoration, and rollback evidence before production.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain future Phase 0 decisions. They do not authorize product implementation in this foundation change.
