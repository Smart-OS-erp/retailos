# Data Protection

## Principles

Collect the minimum data required for the active phase, state its purpose, restrict access, encrypt in transit and at rest using managed platform controls, and define retention/deletion before production use.

## Classification

- **Public:** approved public product information.
- **Internal:** non-sensitive operational documentation.
- **Confidential tenant:** inventory, sales, costs, supplier/customer, workforce, and intelligence data.
- **Restricted:** credentials, authentication artifacts, sensitive personal data, high-risk exports, and privileged audit evidence.

## Controls

- Avoid personal data in URLs, logs, analytics, fixtures, screenshots, and prompts.
- Redact sensitive fields from errors and observability events.
- Limit production access, record privileged access, and review it periodically.
- Define retention and deletion for source data, derived intelligence, uploads, logs, and backups.
- Review data residency, subprocessors, legal bases, consent, and data-subject handling before collecting relevant personal data.
- Test backups and restoration without weakening tenant boundaries.

Production privacy/legal requirements remain an open governance workstream and must be resolved before affected data is processed.
