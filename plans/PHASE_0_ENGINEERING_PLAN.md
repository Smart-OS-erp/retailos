# Phase 0 Engineering Plan

## Status and authority

This is the implementation plan for the explicitly approved Phase 0 end-to-end scope. It does not authorize Phase 0.5 connectors or Phase 1+ commerce, finance, forecasting, warehouse, wholesale, or autonomous agent behavior.

Implementation begins only after:

1. the UI/UX handoff and security gate are accepted;
2. the permission catalogue and six intelligence-rule decisions are approved;
3. PR #3 is merged or this stacked branch is deliberately rebased onto its accepted equivalent;
4. migration history is reconciled before another remote database push.

Each milestone is a vertical slice: schema, RLS, server contract, UI states, negative tests, documentation, and deployment evidence move together. A route must not exist as a fake or inert product surface.

## Team and work split

| Owner | Primary responsibility | Required cross-review |
| --- | --- | --- |
| Team lead / Senior SWE 1 | Architecture, sequencing, integration, migration review, final gate evidence | Reviews all data contracts and milestone diffs |
| Senior SWE 2 — Platform | Supabase schema, RLS, grants, Auth, memberships, locations, audit/outbox, migration/type generation | Security reviews every policy/function; domain SWE reviews API fit |
| Senior SWE 3 — Product/domain | Server actions/services, upload pipeline, consolidation, deterministic rules, projectisation, Copilot templates, E2E | Platform SWE reviews scope/query boundaries; design reviews states |
| Product designer / UI-UX | Information architecture, tokens, responsive interaction, accessibility, all non-happy states | Reviews every implemented screen before acceptance |
| Cybersecurity analyst | Threat boundaries, RBAC/RLS matrix, hostile upload, Copilot, secrets, CI/deployment stop conditions | Can stop a milestone on missing negative evidence |

No engineer self-approves both a privileged database function and its security tests.

## Canonical entity decisions

Preserve the accepted foundation rather than creating parallel authorities.

| Brief concept | Canonical implementation |
| --- | --- |
| `app_users` | New tenant-neutral profile table keyed one-to-one to `auth.users`; contains no authorization role |
| `organizations` | Existing `public.organizations` |
| `organization_memberships` | Existing `public.memberships`; do not create a duplicate table |
| `roles` | Existing `organization_role` enum plus a reviewed application permission catalogue; add a table only if runtime configuration becomes an approved requirement |
| `location_assignments` | New tenant/location-scoped grants with same-tenant composite integrity |
| `onboarding_checklists` | New organization/user workflow state; server-authoritative and resumable |
| `audit_logs` | Existing immutable `public.audit_events` |
| `event_log` | New append-only operational outbox only for domain/job events; it is not authorization or security audit evidence and has separate consumers/retention |

All new tenant rows carry non-null `organization_id`. Location-owned rows also carry `location_id`, with database-enforced same-tenant parentage.

## Shared architecture

- Next.js App Router server components render authorized reads; server actions or route handlers validate mutations.
- Browser clients use only the public Supabase URL and anon key. Normal application requests use the caller session so RLS remains active.
- Service-role use is restricted to narrowly scoped workers/admin fixtures, explicit tenant context, and audit evidence.
- Zod-like runtime validation is required at every external boundary; choose and pin the validation library in Milestone 1.
- Business rules live in pure versioned domain modules, never inside components.
- Mutations use database functions or transactions when authorization, state transition, canonical writes, and audit/outbox must be atomic.
- Generated database types are refreshed after every migration and checked for drift.
- Derived scores retain rule version, input timestamps, source references, organization/location scope, confidence basis, and freshness.
- Long-running upload/consolidation/calculation jobs are idempotent and read server state after reconnect.

## Milestone 0 — Decision and foundation reconciliation

Deliverables:

- accept the corrected UI/UX handoff and security gate;
- approve exact permission identifiers and role-to-permission matrix;
- approve age bands, sales window, cost basis, confidence formula, currency behavior, and recovery-action catalogue;
- reconcile `supabase_migrations` history and update stale acceptance evidence;
- resolve the token-hash email delivery approach;
- verify Vercel Git linkage before any preview attempt.

Gate: no product implementation while any authority, rule, or environment identity is ambiguous.

## Milestone 1 — Secure SaaS foundation expansion

Platform SWE:

- additive migration for `app_users`, location/brand basics, location assignments, onboarding checklist, permission helpers, operational outbox, and expanded audit events;
- operation-specific grants/RLS and last-owner protections;
- generated database types and two-tenant/two-location tests.

Product/domain SWE:

- `/signup`, `/login`, `/logout`, `/create-organization`, and approved onboarding step routes;
- server-resolved onboarding state, role landing, location scope, and complete loading/error/forbidden/session-expired states;
- signup/login/onboarding integration and E2E coverage.

Gate: Auth, organization creation, owner membership, checklist creation, role landing, tenant/location denial, audit, and build/security checks pass.

## Milestone 2 — Trusted data foundation

Platform SWE:

- additive schema and RLS for entities, brands, locations, categories, products, SKUs, uploads, raw rows, staging rows, validation issues, inventory snapshots/positions, and sample-data run lineage;
- private quarantine storage and policies when storage is activated.

Product/domain SWE:

- tenant-scoped sample-data transaction;
- bounded CSV parser first; Excel only after the hostile-workbook gate is feasible;
- upload state machine, mapping, validation severity, warning acceptance, retry/idempotency, and `/data*` surfaces.

Gate: hostile-input corpus, cross-tenant storage/row denial, critical-block behavior, warning acceptance, lineage, cleanup/retention, and sample-data scoping pass.

## Milestone 3 — Consolidation Hub

Platform SWE:

- consolidation runs/items, canonical-match lineage, same-tenant constraints, and current inventory position view;
- atomic approval/consolidation/audit/outbox function.

Product/domain SWE:

- deterministic matching contract, conflict handling, approval snapshot/hash, idempotency;
- `/consolidation*` routes with live persisted operating view and Data Confidence inputs.

Gate: changed or blocked staging data cannot consolidate; retry cannot duplicate; current positions derive from the latest approved snapshot; no static metrics.

## Milestone 4 — Deterministic intelligence

Platform SWE:

- versioned rule configuration/results, risk insights, opportunities, evidence joins, executive briefings, and action cards with RLS.

Product/domain SWE:

- pure tested Data Confidence, Inventory Risk, Recovery Opportunity, and Attention Priority functions;
- aging, dead-stock, sell-through, and weeks-of-cover rules using approved decisions only;
- calculation orchestration, suppression/unknown handling, attention ranking, executive briefing, and `/inventory-recovery*` plus `/attention-queue`.

Gate: persisted inputs only, no mixed-currency fabrication, low-confidence suppression, source/caveat visibility, client-authored score denial, deterministic fixtures, and cross-location leakage tests pass.

## Milestone 5 — Projectisation engine

Platform SWE:

- recovery projects, SKU links, tasks, campaign briefs, approval records, transition functions, and immutable evidence snapshots.

Product/domain SWE:

- opportunity-to-project conversion, recoverable-value calculation, task/approval workflows, deterministic campaign-brief generation, projectised-value calculation, and `/projectisation*` plus `/tasks*` routes.

Gate: valid transitions only; draft and approval permissions are separate; stale/replayed/self/unauthorized approvals fail; no price, stock, publishing, or customer-contact execution exists.

## Milestone 6 — Retail Copilot Phase 0

Platform SWE:

- permission-scoped saved insights/activity records and narrow read-only retrieval functions.

Product/domain SWE:

- deterministic Morning Brief, risk/opportunity/confidence/project explanations, citations, refusals, and recommended internal next steps across `/copilot*`.

Gate: every retrieval reauthorizes; inaccessible citations never render; prompt injection cannot broaden scope; missing data is explained; no real LLM agent execution or high-impact tool exists.

## Milestone 7 — Role workspaces

Product/domain SWE implements live-data Executive, Merchandising, Store, and Viewer workspaces using shared domain queries rather than duplicate dashboard constants. Platform SWE verifies location-scoped query/RLS contracts.

Gate: exact role landing, STORE_MANAGER assigned-location isolation, VIEWER read-only denial, empty/setup states, responsive/accessibility review, and provenance for every metric pass.

## Milestone 8 — Phase gate and deployment readiness

- run lint, typecheck, unit, integration, E2E/smoke, security, dependency audit, and production build;
- run live two-tenant/two-location verification against the reviewed migration set;
- verify protected preview Auth, onboarding, upload, consolidation, intelligence, projectisation, Copilot, and role flows;
- verify headers, secrets/bundles, storage, logs, rollback/forward-fix, monitoring, and incident owners;
- update README, migrations, acceptance evidence, and all current-state/blocker/failure reports.

Production remains a separate explicit approval.

## Test strategy

- Pure unit tests for permission mapping, slug/state logic, parsing, validation, matching, scoring, confidence, values, and Copilot templates.
- PostgreSQL integration tests execute migrations and exercise actual grants, functions, constraints, and RLS.
- Server integration tests call actions/routes with unauthenticated, no-membership, suspended, cross-tenant, wrong-location, and every-role contexts.
- E2E tests cover the approved happy path plus direct URL, session expiry, interruption/retry, forbidden actions, stale approval, and hostile upload paths.
- Every new tenant table is added to automated RLS coverage; every new protected route is added to route-guard coverage.
- Every milestone includes a mutation test that proves removing a representative guard causes failure.

## Delivery discipline

- Keep `phase-0-end-to-end` as the integration branch requested by the product owner.
- Commit milestone-sized, reviewable changes; update reports after each gate.
- Do not merge a milestone with failing or skipped required tests.
- Do not add later routes as empty navigation or static demos.
- If a milestone grows beyond a reviewable PR, use stacked milestone PRs into the integration branch, then one accepted integration PR into `main`.

## Open blockers

- Product-owner approval of the six intelligence decisions.
- Exact permission catalogue and role-to-permission mapping.
- Completion and accessibility verification of the approved dark-navigation/purple-action semantic token set before production UI implementation.
- PR #3 acceptance or deliberate rebase strategy.
- Supabase migration-history repair and confirmation-template delivery.
- Vercel callback currently reports access denied; Git linkage is not verified.
- Named retention, privacy/legal, backup/restore, monitoring, and incident owners before real data or production.
