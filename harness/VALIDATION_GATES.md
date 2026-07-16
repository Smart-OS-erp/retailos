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
