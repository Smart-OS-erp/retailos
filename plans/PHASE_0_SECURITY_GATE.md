# Phase 0 Security Gate Plan

## Status and authority

This is the security design gate for **Phase 0 — Foundation: Inventory Recovery Intelligence**. It authorizes no product feature, schema change, upload, dashboard, Copilot integration, or deployment. `reports/CURRENT_STATE.md` remains the implementation switch, and each milestone still requires an approved implementation plan and reviewable PR.

The repository already contains a secure technical foundation: Next.js/Auth boundaries, `organizations`, `memberships`, `audit_events`, RBAC helpers, forced RLS, atomic organization onboarding, and local security tests. Current reports also state that a synthetic live Supabase isolation run passed. Those controls are a baseline, not proof for future Phase 0 entities. Every new tenant or location surface must pass this gate independently.

RetailOS Security Grade AAA+ is a target supported by implemented evidence. Documentation, static heuristics, a service-role test, or a previously passing schema cannot satisfy a later product gate.

## Non-negotiable rules

1. Fail closed when identity, membership, organization, location, permission, provenance, scan status, or approval state is unknown.
2. Derive effective context from the authenticated server/database session. Client-provided organization IDs, location IDs, roles, status, scores, approval flags, and prompts are untrusted claims.
3. Enforce authorization at UI, server/API, and database layers. UI hiding, middleware routing, and query filters are not security boundaries.
4. Use the caller's Supabase session for normal requests so RLS remains effective. Service-role access is exceptional, server-only, purpose-bound, tenant-scoped, and audited.
5. Require negative tenant, location, role, and workflow tests in the same PR as each new capability.
6. Keep migrations additive and compatible where possible. A table/function rename cannot create a second authority or an unprotected legacy path.
7. Do not process real tenant or personal data until privacy, retention, incident, environment, backup, and recovery gates are approved.

## Trust boundaries

| Boundary | Trust posture | Required controls | Evidence before use |
| --- | --- | --- | --- |
| Browser/mobile client | Untrusted code and input | No privileged secrets; safe session use and output encoding; UI permission hints only; no authoritative tenant, role, score, or approval state | Client import/bundle secret scan; direct-route denial tests; deployed cookie/header evidence |
| Next.js middleware/proxy | Routing/session refresh aid, not sole authorization | Coarse redirects only; protected operations reauthorize on the server | Middleware-bypass and direct-request tests |
| Next.js server/API/actions | Request, resource, and intent boundary | Authenticate; resolve active membership and scope; validate schema; authorize action/resource; enforce size/cost/rate/idempotency; return safe errors; audit | Route inventory, route contracts, unit/integration allow-deny tests |
| Supabase Auth | Identity boundary, not tenant authorization | Exact environment redirects; secure sessions; enumeration resistance; abuse controls; revocation; step-up for high-risk changes | Live valid/invalid/expired/replayed flow tests and configuration evidence |
| Postgres/RLS | Final tenant row boundary | Least grants; RLS on every tenant table; operation-specific policies; `WITH CHECK`; same-tenant constraints; controlled functions | Schema inspection and live two-tenant/two-location tests through production roles |
| Supabase Storage | Tenant object and hostile-file boundary | Private buckets; tenant/location policies; opaque keys; quarantine; scan state; fresh download authorization; safe headers | Cross-tenant object, signed-URL, and scan-state tests |
| Parser/scanner worker | Hostile-content execution boundary | Isolated bounded processing; no privileged app credentials; time/memory/decompression limits; fail-closed scanner behavior | Adversarial corpus and worker failure tests |
| Jobs/queues | Privileged asynchronous boundary | Explicit organization/location/actor/purpose; authorization recheck; idempotency; bounded retries; audit | Cross-tenant payload, replay, stale-permission, and partial-failure tests |
| Cache/search/analytics/export | Derived-data leakage boundary | Tenant and location in keys/indexes/exports; permission-filtered reads; revocation invalidation; retention | Collision, stale-membership, inference, and bulk-export tests |
| Intelligence/Copilot provider | Untrusted input/output/tool boundary | Permission-bounded retrieval; citations; output authorization; typed narrow tools; no silent actions; provider privacy review | Prompt-injection, tool-abuse, cross-tenant, unsupported-claim, and refusal tests |
| CI/CD, Vercel, Supabase control planes | Supply-chain and privileged operations boundary | Least privilege; separated projects/data/secrets; protected environments; reviewed migrations; immutable evidence | Workflow/settings, migration, deployment, rollback, and restore evidence |

No boundary may trust an opaque ID, route, object prefix, signed URL, prompt instruction, cached role, or prior approval without current authorization.

## Tenant and location isolation

### Database invariants

- Every tenant-owned row has a non-null `organization_id` with referential integrity.
- Every location-owned row has both non-null `organization_id` and `location_id`. A composite foreign key or equivalent database constraint proves that the location belongs to the same organization.
- Tenant-wide objects may omit `location_id` only when that ownership is explicitly documented. `NULL` must never ambiguously mean “all locations.”
- Location access uses explicit grants, including an explicitly represented all-locations grant if approved. A role label or missing location row must not accidentally grant all locations.
- Child and join rows preserve tenant identity. Products/SKUs, inventory positions, uploads/staged rows, opportunities/projects/tasks, citations/sources, approvals, and actors/targets cannot attach across tenants.
- Tenant-aware unique constraints, storage paths, job payloads, idempotency keys, caches, search indexes, analytics events, exports, and derived results include organization context and location context where applicable.
- Switching organizations invalidates prior organization caches, subscriptions, signed URLs, pending mutations, job context, and Copilot context.
- Views, RPCs, security-definer functions, realtime, storage, exports, backups, and administrative tools are separate exposure surfaces and receive explicit tests.

### RLS standard

- Revoke unnecessary schema/table/function grants from `anon`, `authenticated`, and public before adding allow policies.
- Enable and force RLS where applicable before a tenant table becomes reachable.
- Define explicit `SELECT`, `INSERT`, `UPDATE`, and `DELETE` behavior. Updates require visibility plus `WITH CHECK`; inserts cannot select an unauthorized tenant or location.
- Resolve active memberships and location grants from authoritative database state. Mutable user metadata and stale JWT role claims are not sole authority.
- Security-definer functions are exceptional and require a pinned safe `search_path`, least grants, fixed contracts, explicit scope checks, no unsafe dynamic SQL, review ownership, and direct abuse tests.
- Run behavior tests with the same `anon` and `authenticated` roles/session claims used by the application. Owner or service-role access does not prove RLS.
- Test failure when RLS is disabled, a policy becomes `USING (true)`, `WITH CHECK` is removed, a helper broadens access, or a grant exposes a table/function.

### Existing schema and migration compatibility

The established foundation authority is currently:

- `public.organizations`
- `public.memberships`
- `public.audit_events`
- `private.has_permission(uuid, text)`
- `public.create_organization(text, text)` delegating to a private implementation

The full brief may use expanded labels such as organization memberships, audit logs, or event log. Those labels do not authorize parallel tables or destructive renames.

- Maintain a reviewed canonical-name map from brief entities to the existing schema before each milestone.
- Keep `memberships` as the single membership authority and `audit_events` as the security audit authority unless a separately approved migration proves a change is necessary. A domain/integration event stream must be distinct from security audit evidence.
- Do not drop or rename current tables, functions, enum values, policies, constraints, or columns solely to match prose. Prefer additive migrations, compatibility APIs/views, validated backfills, and a reviewed cutover.
- Inventory dependent policies, grants, triggers, views, functions, generated types, tests, and callers before any change.
- After every schema milestone, run pre/post schema inspection and live two-tenant plus wrong-location verification. Confirm old and new paths cannot bypass each other and retain rollback or forward-fix evidence.
- Stop on destructive/unreviewed changes, duplicate authorization authorities, orphaned policies/grants, failed migration-history reconciliation, or any live isolation regression.

## RBAC and RLS matrices

### Role baseline

Canonical product roles are `ORG_OWNER`, `EXECUTIVE`, `MERCHANDISING_MANAGER`, `STORE_MANAGER`, and `VIEWER`, represented by the existing lowercase database enum values. Current foundation permissions are narrower than the full Phase 0 baseline: only the permissions already documented in `docs/RBAC.md` exist today. New permission identifiers must be enumerated and tested; they are not inferred from a role's name.

Symbols below: **T** = tenant-wide only with the named permission; **L** = assigned locations/resources only; **P** = separate named permission and any required approval/step-up; **—** = deny by default. Every allowed cell still requires active membership and RLS.

| Capability | ORG_OWNER | EXECUTIVE | MERCHANDISING_MANAGER | STORE_MANAGER | VIEWER |
| --- | --- | --- | --- | --- | --- |
| Read organization identity | T | T | T | L | P/L |
| Change critical organization settings | P | — | — | — | — |
| Invite/suspend members or assign roles/scopes | P | — | — | — | — |
| Transfer/remove last owner | P + recent auth + two-step confirmation | — | — | — | — |
| Read locations/brands | T | T | T/L | L | P/L |
| Manage locations/brands | P | — | P if delegated | — | — |
| Create upload/import session | P | — | P/T or P/L | P/L only if explicitly delegated | — |
| Map/remediate staged data | P | — | P/T or P/L | P/L only if explicitly delegated | — |
| Approve consolidation | P | — | P/T or P/L | — | — |
| Read data health/provenance | T | T | T/L | L | P/L |
| Read inventory and recovery intelligence | T | T | T/L | L | P/L |
| Draft recovery opportunity/project/brief | P | — | P/T or P/L | — | — |
| Approve recovery project/brief | P | P only if delegated | P only if delegated | — | — |
| Update assigned store task | P | — | P | L and assigned task only | — |
| Export tenant/location data | P | P | P | — unless explicitly delegated | — by default |
| Use Copilot explanation/read tools | Effective permission scope | Effective permission scope | Effective permission scope | L only | Explicit read scope only |
| Execute Copilot high-impact action | — in Phase 0 | — in Phase 0 | — in Phase 0 | — | — |
| Read security audit evidence | P | P if delegated | — by default | — | — |
| Modify/delete audit evidence | — | — | — | — | — |

Draft and approval permissions are separate. Self-approval is denied unless an explicit product policy, compensating control, and audit requirement are approved. Price changes, stock movements, customer contact, campaign publishing, autonomous markdowns, and future-phase actions remain prohibited.

### Entity policy baseline

| Entity class | Read | Write | Mandatory evidence |
| --- | --- | --- | --- |
| Organizations | Active member with permitted fields | Controlled owner permission | No-membership, enumeration, owner, and last-owner tests |
| Memberships, roles, location grants | Self-read plus authorized management read | Controlled server/database function; never client-assigned | Self-promotion, cross-tenant, suspended, invitation replay, and concurrent last-owner tests |
| Locations/brands | Organization membership plus scope | Named management permission | Same-tenant composite integrity and wrong-location tests |
| Uploads/files/staging/validation issues | Upload permission plus organization/location | State-machine transition only | Cross-tenant storage/row, scan state, invalid transition, and replay tests |
| Products/SKUs/canonical records | Explicit tenant permission; location restrictions for local state | Approved consolidation path | Tenant-aware uniqueness, lineage, and cross-parent tests |
| Inventory snapshots/positions | Organization plus location permission | Approved import/consolidation path | Two-tenant/two-location CRUD and subscription tests |
| Scores/attention/opportunities | Scope no broader than all inputs | Versioned calculation path; no client-authored score | Source scope, aggregation leakage, stale input, and source removal tests |
| Projects/tasks/briefs/approvals | Organization/location/resource/assignee permission | Explicit authorized state transition | IDOR, self-approval, stale approval, replay, and forbidden transition tests |
| Copilot sessions/citations/tool events | Caller plus effective source permission | Server-controlled creation | Cross-user/tenant/location, revoked permission, and injection tests |
| Audit events | Restricted tenant security/owner read | Append in trusted transaction; no normal update/delete | Actor/tenant integrity, immutable history, and failed-attempt coverage |

## Hostile upload gate

Uploads remain blocked until an upload-specific milestone is approved.

1. **Authorize initiation:** resolve user, active membership, organization, allowed locations, permission, purpose, quota, and rate; issue an opaque upload ID and short-lived authorization.
2. **Quarantine:** write to a private quarantine bucket under an opaque tenant-bound key. A path is not authorization. Normal users cannot download or parse the file before a clean verdict.
3. **Constrain:** allow only approved Phase 0 CSV and, if activated, Excel formats. Verify extension, MIME, magic/container structure, file/aggregate size, rows, sheets, columns, cell length, and compression ratio. Reject password-protected and macro-enabled files unless a separately approved isolated path exists.
4. **Scan/isolate:** use a bounded worker without database-admin/application secrets. Scanner unavailable, timeout, crash, malformed archive, or indeterminate result fails closed to quarantine/rejection.
5. **Parse as hostile:** never evaluate formulas, macros, external relationships, links, or embedded objects. Normalize encoding/delimiters; prevent later CSV formula injection; limit CPU, memory, time, recursion, decompression, and error detail.
6. **Validate and retain lineage:** bind every staged row and issue to organization, location claim, upload hash, parser version, source row, actor, and timestamp. Blocking issues require an authorized, reasoned, audited resolution.
7. **Approve an immutable input:** bind approval to the exact file hash, parsed dataset/version, validation result, scope, approver, and time. Mutation invalidates approval.
8. **Consolidate idempotently:** use a stable tenant-bound idempotency key, same-tenant constraints, bounded transaction/recoverable job, conflict policy, and audit event. Retry cannot duplicate or cross scope.
9. **Retrieve/dispose safely:** reauthorize downloads, use short-lived signed URLs and safe content headers, and define quarantine expiry, accepted/raw/staged retention, orphan cleanup, deletion, and legal hold.

Abuse tests cover extension/MIME mismatch, CSV injection, macro/active content, polyglot, traversal/Unicode names, oversized cells/rows, zip bomb, corrupted workbook, external links, scanner outage, interrupted upload, signed-URL replay, guessed IDs, wrong tenant/location, duplicate approval, parser retry, and malicious values in logs/errors.

## Copilot permission gate

Phase 0 defaults to deterministic/template-based explanation over approved structured results. Real LLM agent execution, broad retrieval, autonomous tools, or external action execution remains prohibited.

- Resolve caller, organization, location grants, permissions, source access, and freshness server-side on every request and every tool call. Prompt text cannot override them.
- Retrieve only fields/records the caller can read directly, then authorize output again before delivery.
- Use narrow typed allowlisted read-only tools. Each tool authorizes independently; prompts are not security controls.
- Never provide service-role credentials, unrestricted SQL/RPC, storage listing, arbitrary URL fetch, code execution, or cross-tenant search.
- Treat uploads, record text, campaign content, retrieval, and tool output as prompt-injection input.
- Cite permitted source records/chips, freshness, confidence, and rule version. Separate facts, deterministic calculations, proposals, and unknowns. Missing/inaccessible evidence produces reduced scope or refusal.
- Recheck permissions at response/tool time so suspension or scope removal invalidates stale sessions, caches, and queued work.
- Copilot may explain and suggest the next internal workflow action. It cannot change prices/stock, publish, contact customers, approve, bypass approval, or invoke future phases.
- Audit bounded request/retrieval/tool/refusal metadata without logging tokens, secrets, full sensitive prompts, raw uploads, or unnecessary tenant data.
- An external provider requires prior approval of retention, training, region, subprocessors, deletion, incident terms, model/version pinning, and tenant-data handling. Training on tenant data is off by default.

Tests include wrong tenant/location, role spoofing, suspension, source access revoked after retrieval, direct/indirect injection, system-prompt/secret requests, inaccessible citations, reconstruction/export attempts, unsafe tool chaining, approval bypass, hallucinated metrics, stale data, provider timeout, and safe refusal.

## Audit gate

### Required events

- Authentication, invitation, recovery, and revocation security outcomes without secrets.
- Organization creation and critical setting change.
- Invitation/acceptance, role/location change, suspension, owner transfer, and failed privileged attempt.
- Upload, scan, parse, validation, override, approval, rejection, consolidation, export/download, retention, and deletion.
- Rule/configuration change, calculation run/suppression, opportunity/project/task/brief transition, approval, and rejection.
- Copilot retrieval/tool/refusal and attempted prohibited action.
- Service-role/admin/job use, migration/policy/grant change, security configuration, and incident containment.

### Record contract

An event carries immutable ID, UTC time, organization, relevant location/resource scope, actor/service identity, effective permission snapshot, action, target, outcome/reason, request/correlation/idempotency IDs, policy/rule/model version, safe source references or hashes, and environment. IP/device metadata requires approved privacy and retention treatment.

Write the audit event in the same transaction as the sensitive change where possible. Normal clients cannot update/delete events. Reads are separately permissioned and tenant-scoped; platform incident access is exceptional and itself recorded. Redact credentials, tokens, raw rows, full sensitive prompts, and hostile content. Approve retention, archive integrity, backup/restore, export, alerting, and legal hold before production.

## Negative security test matrix

Every milestone adds a regression test that fails when a representative guard/policy is removed.

### Identity, membership, and scope

- Deny unauthenticated, malformed, expired, revoked, and cross-environment sessions.
- Deny no-membership, invited-but-unaccepted, suspended, and removed users.
- Changing client organization, role, membership, status, or location input cannot change effective authority.
- Organization switching clears previous caches, signed URLs, subscriptions, pending writes, jobs, and Copilot context.
- Deny self-promotion, over-delegation, invitation replay, concurrent membership mutation, and last-owner removal.

### Database and data paths

- Tenant A cannot select, insert, update, delete, upsert, subscribe to, count/infer, export, or reference Tenant B data.
- Location A cannot access Location B through direct rows, tenant-wide joins, shared products, derived results, storage, or exports.
- Insert/update cannot move a row or attach a parent across tenant/location scope.
- RPCs, views, functions, realtime, storage, caches, search, jobs, and compatibility paths preserve the same denial.
- Tests catch disabled/permissive RLS, missing `WITH CHECK`, stale claim authority, function-owner bypass, grant exposure, and service-role misuse.

### API and workflows

- Direct route/action access enforces permission independent of UI/middleware.
- Deny guessed IDs, mass-assigned tenant/role/status/score fields, excessive query/body/page size, replay, stale approval, and invalid transition.
- Expected retries are idempotent; allowed and material denied outcomes are audited.
- Errors hide record existence, SQL/policies, secrets, tenant data, stack traces, and internal paths.
- Rate, timeout, query-cost, concurrency, and partial-failure bounds fail predictably without unsafe partial writes.

### Upload, intelligence, and Copilot

- Run the hostile upload and Copilot cases above.
- Missing, conflicting, stale, mixed-currency, wrong-location, or unauthorized inputs produce `unknown`, suppression, or reduced confidence—not fabricated results.
- Removing source access removes derived-result/citation access; aggregates do not leak hidden tenants/locations.
- Clients cannot author/overwrite scores, confidence, rule version, approval, provenance, or citations.

Use synthetic fixtures for at least two organizations, two locations, every role, no-membership and suspended users, similarly shaped IDs, and canary values. Evidence records commit, environment/project, migration, command/scenario, expected and observed result, and retained safe artifact.

## Secrets, CI, and deployment gates

### Secrets and supply chain

- Ignore local environment files/generated artifacts; commit only value-free environment examples.
- Scan repository/history, logs, build output, source maps, public assets, and browser bundles for secrets/service-role values. Key-name heuristics alone are insufficient.
- Separate local, test, preview, and production Supabase/Vercel projects, data, and credentials. Public/anon configuration is environment-bound and never authorization.
- Prefer OIDC/short-lived credentials; scope, own, expire, rotate, and audit privileged credentials. Suspected exposure requires immediate revoke/rotate and incident review.
- Keep reproducible locked dependencies; review lifecycle scripts; pin CI actions to reviewed commits; minimize permissions; disable persisted checkout credentials where unnecessary; set timeouts.
- CI must fail if manifest/lockfile disagree, required scripts disappear, security tests fail, or a migration changes without matching behavior tests.

### Preview and production

- Preview never receives production data/secrets by default and is considered public unless protection is verified.
- Migrations run through reviewed automation after migration history is reconciled. Capture schema/grant/policy diff, compatibility result, two-tenant/location tests, backup/restore point, and rollback/forward-fix plan.
- Verify live Auth callback/template behavior, cookie flags, CORS/CSRF design, CSP, HSTS, framing, content-type, referrer/permissions policy, safe errors, rate/body/function limits, and artifact/source-map exposure.
- Verify private storage, signed URL lifetime, least database/network grants, redacted logs, and alerts for auth abuse, policy failures, service-role use, upload scanning, canary leakage, and critical jobs.
- Protect main and production promotion with required CI/security checks, review, environment approval, and no force push. Record deployed commit/migration, configuration, approver, rollback target, and post-deploy smoke/security evidence.
- Production remains blocked until named security, privacy/legal, incident, and environment owners; retention/deletion/data residency; MFA/recovery; monitoring; backup/restore; rollback; and communication procedures are approved and tested.

## Milestone stop conditions

| Milestone | Evidence required | Stop immediately when |
| --- | --- | --- |
| Design/security handoff | Approved boundaries, canonical entity map, permission IDs, threat review, test ownership | Phase scope leaks; evidence/report contradiction is hidden; a prior test is assumed to cover a new entity |
| Foundation reconciliation | Migration history repaired; live test artifact linked; Auth template decision; current docs agree | Schema history is ambiguous; reported live/local state conflicts; privileged access cannot be traced |
| Locations and expanded membership | Additive schema; explicit location grants; same-tenant constraints; last-owner design; two-tenant/two-location tests | `NULL` means all locations; duplicate membership authority; cross-tenant relationship; last-owner gap |
| Every schema milestone | Reviewed additive migration; grants/RLS matrix; generated types; pre/post live isolation; rollback/forward-fix | Destructive/unreviewed rename/drop; orphaned policy/grant; failed isolation; no recovery path |
| Upload/staging | Private quarantine; scan/parser limits; state machine; lineage; retention owner; hostile tests | Pre-scan availability; active content execution; scanner fail-open; scope leak |
| Consolidation/canonical data | Immutable approved input; idempotency; conflict policy; same-tenant constraints; transactional audit | Changed/unapproved data consolidates; retry duplicates; scope mismatch; provenance loss |
| Intelligence/opportunities | Approved rules; deterministic versioning; source/freshness/confidence; output auth; leakage tests | Open product rules are guessed; static/fabricated metrics; inaccessible inputs contribute; client-authored score |
| Projects/tasks/briefs | Authorized state machine; separate draft/approval; assignment/location checks; replay tests | Self/unauthorized approval; prohibited external action; invalid/unaudited transition |
| Copilot explanation | Deterministic/template baseline; typed read tools; permission recheck; citations; adversarial tests | Broad credentials/tools; prompt controls auth; inaccessible citation; silent high-impact action |
| Protected preview | Git-linked protected preview; non-production secrets/data; deployed Auth/RLS/storage/header smoke evidence | Preview exposes production material; environment identity ambiguous; isolation/migration check fails |
| Production | All gates; incident/privacy owners; retention; restore/rollback; monitoring; accepted residual risks | Any high/critical open risk; missing isolation evidence; unknown secret/environment state; untested recovery; no incident owner |

## Current disposition

- **Secure foundation:** implemented with reported local and synthetic live evidence for the current three-table boundary. It does not automatically pass future Phase 0 entities.
- **Evidence reconciled in this planning change:** `docs/ACCEPTANCE_TESTS.md` and `reports/TECHNICAL_FOUNDATION_VALIDATION.md` now distinguish the original local-only report from the later non-production migration/live-isolation evidence. Migration-history repair and hosted confirmation-template verification remain open.
- **Release blockers:** migration history repair, hosted confirmation-template capability, protected preview/Git linkage, production governance owners, retention/deletion, MFA/recovery, monitoring, backup/restore, and rollback evidence remain open.
- **Product decisions:** scoring thresholds, analysis windows, cost basis, currency behavior, confidence formula, and action catalogue must be approved before intelligence implementation.
- **Next allowed action:** review and accept the combined design/engineering/security handoff, then implement one security-gated Phase 0 milestone at a time.
