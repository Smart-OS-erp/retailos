# Penetration Test Readiness

Penetration testing is meaningful only after a stable, representative, authorized environment exists. The harness is not pen-test ready as an application because no application exists.

## Entry checklist

- Architecture, data flows, assets, roles, route inventory, integrations, and threat model are current.
- Test scope, rules of engagement, timing, contacts, source IPs, credentials/roles, data handling, and stop conditions are approved.
- A production-like non-production environment contains synthetic data for at least two tenants.
- Logging and incident contacts can distinguish test activity.
- Backups and recovery are verified; destructive tests have explicit approval.
- Known findings and accepted risks are shared with testers.

## Required focus

Tenant breakout, IDOR/BOLA, authentication recovery, role escalation, RLS/RPC/storage bypass, uploads, secrets, API abuse, business-logic manipulation, and Copilot injection/tool abuse where implemented.

Findings require severity, reproduction, affected asset, owner, due date, remediation evidence, and retest. Critical issues trigger the incident process when exposure may be real.
