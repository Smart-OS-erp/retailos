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
