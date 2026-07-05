# Incident Response

## Lifecycle

1. **Detect and report:** capture time, reporter, symptoms, affected environment, and safe evidence.
2. **Triage:** assign incident lead, severity, assets/tenants at risk, and communication channel.
3. **Contain:** revoke credentials/sessions, restrict access, isolate workloads or integrations, and preserve evidence.
4. **Eradicate:** fix the exploited condition and remove persistence without destroying forensic data.
5. **Recover:** restore verified service, monitor closely, and validate tenant boundaries and data integrity.
6. **Communicate:** follow contractual/legal notification requirements using approved owners and accurate facts.
7. **Learn:** complete a blameless review, control/test updates, owners, and deadlines.

## Severity principle

Suspected cross-tenant access, secret compromise, unauthorized privileged action, material data loss, or active exploitation is treated as high severity until evidence reduces it.

## Preparation gaps

Named contacts, on-call path, legal/privacy owners, notification timelines, evidence retention, external providers, and status communication channels must be completed before production launch.
