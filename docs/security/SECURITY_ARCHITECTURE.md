# Security Architecture

## Target

RetailOS targets Security Grade AAA+: tenant isolation by default, defense-in-depth authorization, protected data, controlled privileged access, and security evidence before completion.

## Trust boundaries

- **Browser:** untrusted execution environment. It may hold a user session through approved mechanisms but never service-role secrets.
- **Next.js server/API:** validates session, request shape, tenant context, permission, and intent before privileged work.
- **Supabase Auth/Postgres/Storage:** authoritative identity and data-policy boundary; tenant tables use RLS and storage uses equivalent scoped policies.
- **External services:** untrusted until allowlisted, authenticated, minimized, contractually reviewed, and monitored.
- **Copilot/model providers:** receive only the minimum authorized context and cannot become an authorization authority.

## Control layers

Identity establishes the principal. Membership establishes organization context. RBAC establishes allowed operations. RLS enforces row-level tenant access. API validation and resource checks constrain intent. Audit events support detection and investigation. UI controls communicate permissions but never replace server/database enforcement.

## Privileged operations

Service-role use is restricted to server-side, narrowly scoped administrative or background workflows with explicit tenant context, validation, audit, and secret management. Normal user requests use the user's session so RLS remains effective.

## Security completion rule

A feature is incomplete until its abuse cases and negative authorization paths are tested. Open high/critical risks block release; exceptions require named owner, expiry, compensating controls, and human approval.
