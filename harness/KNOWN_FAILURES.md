# Known Harness Failures

## Placeholder drift

**Failure:** a TODO check continues to exit successfully after relevant product code exists.
**Prevention:** application-scaffold and feature PRs must replace affected placeholders with enforceable checks.

## Phase leakage

**Failure:** future roadmap items appear as routes, tables, navigation, fake dashboards, or demos during Phase 0.
**Prevention:** compare every diff with `reports/CURRENT_STATE.md` and `docs/PHASE_0_SCOPE.md`.

## Security theatre

**Failure:** UI role checks or query filters are described as tenant isolation without API and RLS enforcement.
**Prevention:** require negative tests at UI/API/database layers and two-tenant policy evidence.

## Heuristic confidence

**Failure:** static scanners are treated as proof that routes and queries are safe.
**Prevention:** call scanners heuristic and pair them with integration/policy tests once code exists.

## False green CI

**Failure:** placeholder lint/test/build steps are read as product validation.
**Prevention:** steps print explicit TODO/not-applicable notices and validation reports preserve that distinction.

## UI foundation product drift

**Failure:** M0.9 placeholder navigation, dashboard KPIs, module groups, roles, statuses, supplier/warehouse/finance terminology, locations, or demo records are treated as final product requirements.
**Prevention:** mark M0.9 placeholders as provisional in configuration, documentation, tests, and UI copy until retail-consultant validation and product discovery approve them.

## Component-library drift

**Failure:** a second UI framework or one-off component pattern appears during the shared UI foundation.
**Prevention:** shadcn/ui is the approved foundation, Ant Design is prohibited, and shared shell, RetailDataGrid, formatting, status, loading, empty, and error primitives must be reused by new UI work.

## Unreproducible platform state

**Failure:** Supabase/Vercel dashboard settings exist without migrations/configuration/evidence.
**Prevention:** capture configuration as code where supported and maintain reviewed setup evidence.

## Stale production source of truth

**Failure:** README, reports, and docs describe an older phase while `main` and production contain newer routes or workers.
**Prevention:** milestone PRs that materially change runtime behavior must update README, `reports/CURRENT_STATE.md`, `reports/NEXT_TASK.md`, blockers, recent failures, and release/checkpoint evidence.

## Runtime error amnesia

**Failure:** a production 5xx is found during smoke testing but later historical green evidence is treated as acceptance.
**Prevention:** current runtime failures must be added to `reports/RECENT_FAILURES.md`, resolved or kept as blockers, and rechecked after smoke.

## Migration-history drift

**Failure:** migrations applied through SQL Editor are not present in Supabase CLI history, so a future push may replay or conflict.
**Prevention:** every migration-affecting milestone must run `supabase migration list` or document the exact blocker and owner commands.

## Runtime-version drift

**Failure:** Vercel project runtime, CI Node version, package engine, and docs disagree.
**Prevention:** production-affecting milestones must inspect runtime settings and align or document owner action before acceptance.

## Repository governance drift

**Failure:** branch protection, stale branches, dependency alerts, or repository visibility decisions are left implicit.
**Prevention:** reconciliation milestones must audit these settings, safely delete definitely merged branches where permitted, and record founder decisions required for visibility/governance.

## Inventory lifecycle collapse

**Failure:** transfer approval directly mutates destination stock, adjustment approval directly mutates on-hand quantity, or retries double-post movement ledger rows.
**Prevention:** Phase 1 stock-affecting workflows must keep approval separate from execution/dispatch/receipt, use idempotency keys, keep source lineage, and test before/after balance behavior.
