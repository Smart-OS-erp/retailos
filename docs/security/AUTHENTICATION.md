# Authentication

## Requirements

- Use Supabase Auth through the implemented `@supabase/ssr` cookie pattern.
- Use HTTPS everywhere outside controlled local development.
- Prefer secure, HTTP-only, same-site session cookies for server-rendered flows; do not expose reusable tokens unnecessarily.
- Validate redirect targets against an allowlist and separate local, preview, and production callback URLs.
- Rate-limit and monitor sign-in, sign-up, reset, OTP, and invitation endpoints.
- Prevent account enumeration in externally visible responses.
- Require recent authentication or step-up controls for high-risk changes when introduced.
- Support revocation after password, membership, compromise, or administrative changes as appropriate.

## MFA and recovery

MFA policy, recovery codes, support-assisted recovery, and owner-account safeguards must be decided before production. Recovery may not bypass tenant membership or role enforcement.

## Testing

Cover expired/malformed sessions, revoked users, replayed links, open redirects, cross-environment callbacks, brute-force controls, and concurrent session behavior. Never log passwords, OTPs, reset links, access tokens, or refresh tokens.

The repository currently verifies redirect allowlisting and server reauthorization structurally. Live Auth behavior remains blocked until the non-production Supabase Auth settings and migration are configured.
