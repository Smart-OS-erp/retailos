# Phase 0 Senior SWE Feasibility Review

## Disposition

The corrected UI/UX handoff is feasible as a sequence of secure vertical milestones. It is not feasible or safe as one undifferentiated implementation pass. Build should start with Milestone 1 only after the decision gates in the engineering plan are accepted.

## Feasibility findings

### Routes and workflow state

- The approved route inventory is large but can share a small number of server-authoritative workflow/state machines.
- Onboarding step URLs must read one persisted checklist; navigating directly cannot mark earlier steps complete.
- Upload, consolidation, project, approval, and Copilot routes must render from persisted state and never from route-local demo constants.
- Role workspace routes should compose shared permission-scoped queries instead of cloning business logic.

### Existing-foundation compatibility

- Preserve `organizations`, `memberships`, `audit_events`, role enum values, and the atomic organization function.
- Map the brief's logical membership/audit entities to those authorities.
- Add profiles, location grants, onboarding state, and operational outbox through additive migrations.
- Do not destructively rename tables while PR #3 migration history is unresolved.

### Data and security risks

- Location scope is the largest authorization expansion: it affects RLS, joins, derived scores, workspaces, tasks, citations, caches, and exports.
- Upload parsing is a hostile-content boundary, not a browser convenience. CSV is practical first; Excel is conditional on bounded isolated parsing and active-content rejection.
- Derived intelligence cannot be built before the six product rules are approved. Tests must assert `unknown`/suppression for insufficient or mixed-currency evidence.
- Project approvals require replay-safe state transitions and separate draft/approval permissions.
- Copilot is feasible as deterministic templates over authorized structured results; a general model/tool agent is outside Phase 0.

### Performance and mobile constraints

- Paginate and filter uploads, issues, attention items, projects, tasks, and activity at the server/database boundary.
- Avoid N+1 evidence and permission queries; use reviewed views/RPCs that retain RLS and location scope.
- Long parsing/consolidation/calculation work needs resumable job state and bounded batches; do not hold a browser request open indefinitely.
- Mobile tables need task-card/detail alternatives without omitting confidence, freshness, currency, or permission state.
- Cache keys and revalidation tags must include organization and location context; organization switching invalidates them.

### Testability

- Pure domain modules make validation, matching, scoring, confidence, value, and deterministic Copilot output easy to fixture and mutation-test.
- PGlite remains useful for fast policy behavior, but every milestone also requires live Supabase role tests.
- E2E fixtures need two organizations, two locations, all five roles, a suspended/no-membership user, similarly shaped records, hostile files, and stale/low-confidence data.
- Browser verification must cover keyboard/focus, narrow viewport, direct URLs, session expiry, interruption, and safe errors.

## Recommended implementation order

1. Decisions, permission catalogue, migration-history repair, token reconciliation.
2. Expanded identity/onboarding/location foundation.
3. CSV/sample data and validation.
4. Consolidation and current inventory.
5. Approved deterministic intelligence.
6. Projectisation and approvals.
7. Deterministic Copilot.
8. Role workspaces and full phase gate.

## Stop conditions

- Generic role names or client-supplied roles replace canonical RetailOS permissions.
- A duplicate membership/audit authority is introduced.
- A tenant/location table lacks same-scope constraints, RLS, and negative tests.
- Numeric intelligence defaults are invented without product approval.
- Upload data is readable or parsed before quarantine/validation controls.
- Static dashboard values or fake successful workflows appear.
- Copilot retrieves more data than the caller can open directly.
- A Vercel deployment target or Git connection is ambiguous.

## Questions requiring product-owner approval

1. Approve the six intelligence-rule decisions listed in the UI/UX handoff.
2. Approve the exact permission identifiers and whether EXECUTIVE or MERCHANDISING_MANAGER may approve recovery projects/briefs.
3. Confirm whether Excel is required for the first upload milestone or may follow CSV after its security gate.

Until these are answered, engineering may reconcile the foundation and prepare tests/migrations, but must not implement final scoring or production UI semantics that depend on the decisions.
