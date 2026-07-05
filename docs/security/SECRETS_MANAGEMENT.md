# Secrets Management

## Rules

- Store deployed secrets in Vercel, Supabase, or another approved managed secret store; use `.env.local` only for local development.
- Never commit secrets, real tokens, credentials, private keys, webhook secrets, database URLs with credentials, or production exports.
- Public/anon values are treated as configuration and still restricted to intended environments; service-role and private credentials remain server-only.
- Never prefix a secret with `NEXT_PUBLIC_` or expose it through browser-readable runtime configuration.
- Scope credentials by environment and service, grant least privilege, rotate them, and record owner/purpose/expiry.
- Redact commands, logs, CI output, errors, screenshots, and support artifacts.
- Prefer short-lived identity/OIDC mechanisms over long-lived keys when supported.

## Incident procedure

On suspected exposure: stop propagation, revoke/rotate immediately, preserve safe evidence, assess access logs and affected data, notify the incident owner, remediate the source, and document lessons. Removing a secret from the latest commit alone does not invalidate it or erase history.
