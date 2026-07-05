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
