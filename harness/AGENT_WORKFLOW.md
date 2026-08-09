# Agent Workflow

## Start

1. Read `AGENTS.md` and `reports/CURRENT_STATE.md`.
2. Compare the request to the active phase and hard prohibitions.
3. Read the specialized docs and current blockers relevant to the change.
4. Inspect branch/status before editing; preserve unrelated work.

## Autonomous continuation command

The exact owner command `continue autonomously` activates continuous milestone progression. Interpret it case-insensitively and ignore surrounding whitespace or final punctuation.

On activation:

1. Read `AGENTS.md`, the canonical roadmap/milestone source, `reports/CURRENT_STATE.md`, `reports/NEXT_TASK.md`, `reports/OPEN_BLOCKERS.md`, and `reports/RECENT_FAILURES.md`.
2. Inspect `main`, open pull requests, workflow results, migrations, hosted database state where accessible, preview deployment, production deployment, runtime errors, and unresolved blockers.
3. Resolve the earliest incomplete eligible milestone from the authoritative roadmap, dependency status, current-state reports, blockers, and actual Git/migration/deployment evidence.
4. Implement, validate, PR, preview-review, merge when checks allow, verify production, record evidence, and update current state.
5. Repeat for the next eligible milestone until a human gate or mandatory technical stop condition is reached.

Do not ask whether to continue when the contract permits the next action. Do stop for destructive production actions, missing secrets, paid-plan requirements, legal/privacy/pricing/contract decisions, original consultant or customer-pilot acceptance, production external-system write-back, payment/POS fiscal decisions, security-boundary reductions, failed tenant/location isolation, migration-history disagreement, critical/high security defects, failed production smoke, real retailer data in synthetic paths, or insufficient milestone definition.

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
