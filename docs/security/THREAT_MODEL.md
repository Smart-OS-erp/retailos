# Threat Model

## Protected assets

Tenant inventory and commercial data, user identity and sessions, memberships and roles, secrets, uploads, audit evidence, intelligence inputs/outputs, and operational availability.

## Primary actors

Unauthenticated attackers; malicious or compromised tenant users; over-privileged staff; compromised integrations; supply-chain attackers; automated abuse; and prompt-injection content targeting Copilot.

## Priority threats and controls

| Threat | Primary controls | Required evidence |
| --- | --- | --- |
| Cross-tenant data access | RLS, organization membership, server authorization, tenant-key integrity | two-tenant negative CRUD tests |
| Role escalation | server-owned role changes, least privilege, last-owner guard, audit | permission matrix tests |
| Session theft/replay | secure cookies, HTTPS, rotation/revocation, short-lived sensitive flows | auth integration tests |
| Secret/client leakage | managed secrets, public-variable denylist, bundle scanning | repository and build scans |
| API abuse/IDOR | authentication, resource authorization, schemas, rate controls | route inventory and negative tests |
| Malicious uploads | private storage, type/size allowlists, random keys, scan/quarantine | upload abuse tests |
| SQL/query scope error | RLS, scoped repositories, lint/static checks | policy and query tests |
| Prompt injection/data exfiltration | permission-filtered retrieval, tool allowlists, output controls | adversarial Copilot tests |
| Dependency compromise | lockfiles, review, scanning, minimal dependencies | CI scan evidence |
| Availability abuse | quotas, rate limits, timeouts, bounded jobs, monitoring | load/abuse scenarios |

## Review triggers

Update the threat model when adding a data class, API, role, integration, upload, model/tool, background job, authentication method, or production deployment path.
