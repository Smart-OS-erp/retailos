# Security Checklist

## Every change

- [ ] Work belongs to the active phase.
- [ ] Data and trust boundaries are identified.
- [ ] No secrets or real sensitive data are committed or logged.
- [ ] Authentication and permission requirements are explicit.
- [ ] Tenant scope exists at API, query, storage, job, cache, and intelligence boundaries.
- [ ] Inputs, outputs, limits, errors, and audit behavior are defined.
- [ ] Negative and cross-tenant tests accompany implemented controls.
- [ ] Security scripts and relevant quality gates run.

## Before tenant data

- [ ] Organizations, memberships, permission model, and RLS policies are reviewed.
- [ ] Every tenant table has RLS and two-tenant CRUD tests.
- [ ] Service-role usage is server-only, exceptional, scoped, and audited.
- [ ] Auth redirects, sessions, abuse controls, and recovery are tested.
- [ ] Retention, deletion, backup, restore, logging, and privacy requirements are approved.

## Before production

- [ ] Threat model, route inventory, role matrix, and incident contacts are current.
- [ ] Preview/production separation, managed secrets, headers, monitoring, and alerts are verified live.
- [ ] Dependency/secret/security scans and acceptance tests pass.
- [ ] Upload and Copilot reviews pass if those surfaces exist.
- [ ] High/critical findings are resolved; exceptions are owned, expiring, and approved.
- [ ] Rollback and database compatibility are tested.
