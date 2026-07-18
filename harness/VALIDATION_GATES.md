# Validation Gates

| Gate | Question | Harness evidence | Product-era evidence |
| --- | --- | --- | --- |
| Intent | Is work authorized by the active phase? | current-state and diff review | linked story/plan and phase review |
| Architecture | Are boundaries and failures understood? | product/security docs | diagrams, ADRs, schemas, failure tests |
| Security | Do AAA+ invariants hold? | security docs and placeholder scripts | RLS/RBAC/API/upload/Copilot tests and live config evidence |
| Quality | Is the change mechanically sound? | file/JSON/YAML/script checks | lint, typecheck, unit, integration, e2e, build |
| Acceptance | Does it deliver the active outcome truthfully? | harness checklist | scenario evidence with real authorized data paths |
| Release | Can it deploy, observe, recover, and respond? | deployment/incident plans | preview/prod verification, rollback, alerts, runbooks |

## Gate outcomes

- **Pass:** required check ran and evidence satisfies the gate.
- **Fail:** evidence contradicts a requirement; work cannot progress as complete.
- **Blocked:** named missing authority, dependency, or decision prevents the check.
- **Not applicable:** the relevant implementation does not exist; this is not equivalent to pass.

## Evolution

When `package.json` and the application scaffold are added, replace CI TODO steps with repository scripts in the same PR. When the first tenant table/API/upload/Copilot capability is added, replace the corresponding heuristic placeholder with tests capable of failing on a real regression.

## Production and migration gate addendum

Production-affecting milestones must provide:

- current production commit and deployment ID;
- route smoke evidence for `/login`, `/signup`, and representative protected routes;
- fresh production smoke evidence for affected APIs using synthetic data and cleanup;
- post-smoke runtime error inspection;
- rollback deployment or commit;
- environment-variable presence verification without values;
- Node runtime alignment across `package.json`, CI, docs, and Vercel;
- updated README, `reports/CURRENT_STATE.md`, `reports/NEXT_TASK.md`, `reports/OPEN_BLOCKERS.md`, and `reports/RECENT_FAILURES.md`.

Migration-affecting milestones must provide:

- repository migration list;
- hosted migration-history status;
- local reset or an explicit blocker;
- RLS/function/grant/enums verification after reset or hosted schema verification;
- assurance that SQL Editor application has been reconciled with CLI history before later `db push`.

No production smoke test may expose secrets. A milestone cannot be called complete while a current production 5xx caused by that milestone remains unresolved.

## Phase 1 Visible Workflow Acceptance validation gate

Phase 1 acceptance is not satisfied by the existence of routes, migrations,
tests, or deployments alone.

Required evidence:

- representative inventory users can complete visible inventory workflows using
  persisted tenant data;
- adjustment execution/reversal, transfer dispatch/receipt, and stock-count
  closure/correction are idempotent and do not double-post ledger rows on retry;
- saved watchlist add/remove is permissioned, audited, and does not suppress the
  derived persisted-evidence stock signal;
- viewer, suspended, cross-tenant, and unassigned-location operations fail
  closed at the database/API boundary;
- audit events exist for sensitive actions;
- live hosted smoke uses synthetic data and confirms cleanup;
- production deployment evidence records commit, Vercel deployment, route smoke,
  runtime-error inspection, rollback target, and migration-history status;
- any missing Supabase CLI, production smoke, or governance evidence is recorded
  as conditional or blocked rather than treated as pass.

## M0.9 — RetailOS UI Foundation validation gate

M0.9 is approved as a Phase 0 frontend-foundation milestone. It validates shared frontend architecture and visual-system readiness before broad Phase 0 feature expansion. It must not be used to finalize retail product requirements.

Required M0.9 evidence:

- shadcn/ui is the only approved component foundation; Ant Design is absent.
- shared design tokens exist and are used by shared UI primitives.
- a shared application shell exists for future pages.
- navigation, dashboard configuration, status mappings, tenant market defaults, and formatting utilities are centralized.
- Nigeria/en-NG/NGN/Africa-Lagos demo defaults are present, use the `Africa/Lagos` timezone identifier, and are overridden by tenant settings where available.
- currency, date, locale, and timezone presentation use shared utilities; UI modules do not manually concatenate currency symbols.
- new tables use RetailDataGrid unless an exception is documented.
- loading, empty, error, forbidden, stale, and success states are available as shared presentation primitives.
- responsive behavior and keyboard/focus accessibility are tested for foundation components.
- placeholder dashboard/navigation/module/status/demo content is explicitly marked provisional and replaceable.

M0.9 must be reported as blocked or incomplete if any placeholder navigation, KPI, card order, workflow term, role, supplier, warehouse/finance term, or demo record is presented as a final product requirement.

## Phase 1 M6 — Inventory Operations Core validation gate

Required evidence:

- migration adds operational lifecycle states without deleting accepted
  foundation history;
- current balances are calculated from approved snapshots plus movement ledger
  deltas, reservations, and in-transit transfer quantities;
- adjustment execute/reverse and transfer dispatch/receipt operations are
  transactional, permissioned, idempotent, and audited;
- partial transfer receipt records discrepancy evidence and final receipt
  resolves short-receipt discrepancies;
- Phase 1 UI uses the shared shell, RetailDataGrid, shared status mapping, and
  shared formatting utilities;
- tests cover positive flow, idempotent retry, cross-tenant denial,
  under-privileged denial, and location-scope denial;
- production release evidence records hosted migration status, deployment ID,
  smoke route results, runtime errors, and rollback target.
