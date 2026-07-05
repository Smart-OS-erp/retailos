# Security Test Plan

## Test layers

- **Static:** secret scan, dependency review, prohibited client credential patterns, route/query heuristics, and configuration review.
- **Unit:** permission decisions, input schemas, business-rule bounds, redaction, and tenant key construction.
- **Integration:** Auth/session behavior, API authorization, RLS CRUD isolation, database functions, storage policies, audit events, and webhook verification.
- **E2E:** unauthenticated, wrong-role, wrong-tenant, stale/revoked session, approval, and recovery paths.
- **Adversarial:** upload payloads, enumeration, rate abuse, injection, prompt injection, and unsafe Copilot tools when applicable.

## Required fixtures

At least two tenants, multiple roles, a user with no membership, suspended/expired membership states where supported, similarly shaped record IDs, and controlled sensitive values that make leakage detectable.

## CI policy

Security checks run on pull requests and main. A real implemented control must have a failing regression test. Placeholders must say TODO and cannot satisfy a product gate. High/critical findings or failed tenant-isolation tests block merge/release.

## Evidence

Record commit, environment, command, result, and artifact. Keep test data synthetic and secrets ephemeral. Manual testing complements automated evidence but does not replace repeatable regression checks.
