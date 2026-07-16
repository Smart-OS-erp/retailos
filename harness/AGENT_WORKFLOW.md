# Agent Workflow

## Start

1. Read `AGENTS.md` and `reports/CURRENT_STATE.md`.
2. Compare the request to the active phase and hard prohibitions.
3. Read the specialized docs and current blockers relevant to the change.
4. Inspect branch/status before editing; preserve unrelated work.

## Plan and implement

1. State the smallest outcome and affected gate(s).
2. Identify data, tenant, authorization, secret, upload, external-service, and Copilot implications.
3. Implement only the active-phase slice; do not add speculative screens, APIs, tables, or dependencies.
4. Add positive and negative tests with the control, not afterward.
5. Record decisions and any known limitation honestly.

## Validate and hand off

1. Run minimum validation and all toolchain checks relevant to the diff.
2. Inspect the final diff for phase leakage, fake data, unscoped access, secrets, and misleading pass claims.
3. Update state/failure/blocker reports when reality changed.
4. Commit only scoped files, push the intended branch, and open a draft PR unless explicitly requested otherwise.
5. Use the final response format in `AGENTS.md`.

An agent stops and escalates when safe completion needs a phase change, missing authority, destructive production action, unreviewed security exception, or unavailable required credential/owner decision.

## Production-affecting handoff

For any milestone that affects production, the agent must:

1. inspect current production deployment state;
2. record commit SHA and deployment ID;
3. verify route reachability and protected-route behavior;
4. inspect runtime errors after smoke checks;
5. record or update rollback target;
6. add production failures to `reports/RECENT_FAILURES.md`;
7. update `reports/RELEASE_CHECKPOINT.md` when a checkpoint is created;
8. avoid exposing secrets in commands, logs, reports, screenshots, or PR bodies.

Import API milestones require a fresh database-connected smoke test. A current Import API 5xx blocks acceptance until resolved or explicitly left as an open blocker.
