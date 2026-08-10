# Senior SWE Codebase Readiness Review

Date: 2026-08-10

Scope: Phase 2B M2.9. This review evaluates whether the repository is coherent enough for senior engineers and constrained local-model agents to maintain safely.

## Decision

RetailOS is suitable for controlled senior-engineer continuation under the harness after M2.7-M2.9, but not yet suitable for unsupervised broad autonomous product expansion.

Routine local-model/OpenCode work is acceptable only for narrow, harness-defined tasks with validation gates. Architecture, migrations, security boundaries, and domain-rule changes still require senior review.

## Findings

### P0 findings

None found in this Phase 2B review.

No evidence was found of committed secrets, client-side service-role usage, or an active production deployment failure during inspection. Static security scripts remain in place.

### P1 findings

#### P1-1 — Supabase CLI migration-history/reset verification remains incomplete

- Evidence: `reports/OPEN_BLOCKERS.md`; no recorded successful `supabase migration list` or `supabase db reset` evidence.
- Affected files/modules: `supabase/migrations/`, `docs/SUPABASE_SETUP.md`, release process.
- Why it matters: hosted SQL verification does not prove local migration history is clean or reproducible.
- Recommended remediation: install/authenticate Supabase CLI, link approved project, run safe migration-history/reset commands, and record evidence.
- Risk of remediation: medium; must avoid destructive production commands.
- Test/evidence required: `supabase migration list`, local reset output, and recorded migration-history agreement.
- Status after M2.11 campaign: still open; `supabase` CLI is not installed in this shell.

#### P1-2 — Main branch protection could not be verified or enabled from current token

- Evidence: GitHub branch protection API returned `404 Not Found` for `main` on read and update attempts.
- Affected files/modules: GitHub repository settings.
- Why it matters: release discipline depends on enforced PR, CI, security, and no force-push/delete controls.
- Recommended remediation: repository admin enables branch protection in GitHub UI or with an admin token.
- Risk of remediation: low if configured with existing required checks.
- Test/evidence required: successful branch protection API read showing required checks and force-push/delete blocks.
- Status after M2.11 campaign: remediated; branch protection was enabled and verified by API.

#### P1-3 — Business-rule authority is still split across SQL, TypeScript, UI, and tests

- Evidence: inventory/risk/confidence/productivity logic appears in migrations, `src/lib/intelligence/*`, `src/lib/ui/status.ts`, and integration tests.
- Affected files/modules: `supabase/migrations/`, `src/lib/intelligence/`, `src/lib/ui/status.ts`, `tests/integration/*`.
- Why it matters: divergent definitions can create different answers between database views, UI, Copilot, and tests.
- Recommended remediation: create rule registry/versioning for inventory position, sell-through, weeks of cover, aging, risk, confidence, recovery recommendations, merchandising productivity, and markdown decisions.
- Risk of remediation: medium/high; requires careful compatibility tests.
- Test/evidence required: deterministic fixtures proving SQL and TypeScript agree on key formulas.
- Status after M2.11 campaign: remediated to pre-pilot baseline with `docs/domain/BUSINESS_RULE_CONTRACT.md`, `src/lib/business-rules/retail-rules.ts`, V3 golden outcomes, and domain consistency tests.

#### P1-4 — Large action/test modules increase regression risk before pilot

- Evidence: `src/app/inventory/actions.ts` has 447 lines; `src/app/data/actions.ts` has 414 lines; multiple integration tests exceed 700 lines.
- Affected files/modules: inventory/data actions and integration tests.
- Why it matters: adding workflows to already-large files makes review and permission-boundary reasoning harder.
- Recommended remediation: split by command/query lifecycle and test fixture builders when touching these areas.
- Risk of remediation: medium; avoid broad rewrites without a feature reason.
- Test/evidence required: unchanged integration/security test behavior after any split.

### P2 findings

#### P2-1 — Generated database types are large but expected

- Evidence: `src/types/database.ts` has 2,506 lines.
- Affected files/modules: database typing.
- Why it matters: large generated files can distort health metrics and should not be manually maintained.
- Recommended remediation: document generation source and exclude generated files from some maintainability thresholds.
- Risk of remediation: low.
- Test/evidence required: typecheck.

#### P2-2 — CSS foundation is large

- Evidence: `src/app/globals.css` has 1,349 lines.
- Affected files/modules: frontend design system.
- Why it matters: large global CSS can become a hidden dependency for future UI work.
- Recommended remediation: split tokens, base rules, components, and utilities during the next UI-system maintenance window.
- Risk of remediation: medium due visual regression risk.
- Test/evidence required: browser visual smoke and component tests.

#### P2-3 — Non-null assertions are concentrated in tests

- Evidence: code-health scan found 158 `!.` member assertions.
- Affected files/modules: primarily integration tests.
- Why it matters: excessive assertions can hide fixture setup failures.
- Recommended remediation: introduce typed test fixture helpers that fail with clear messages.
- Risk of remediation: low/medium.
- Test/evidence required: unit/integration suite.

### P3 findings

#### P3-1 — Node warning for TS scripts under Node 26

- Evidence: `npm run code-health` warned about typeless ESM parsing for `.ts` scripts in local Node 26.
- Affected files/modules: harness scripts.
- Why it matters: warning noise reduces signal quality; Vercel uses Node 22.
- Recommended remediation: convert small harness scripts to CommonJS-compatible style or define package module behavior deliberately.
- Risk of remediation: low.
- Test/evidence required: `npm run harness:validate`, `npm run code-health`.
- Status: remediated during M2.9 by converting harness scripts to CommonJS-compatible imports while keeping Node-executable `.ts` scripts.

## Remediation applied in this campaign

- Added canonical machine-readable roadmap, milestones, quality gates, and human gates.
- Reduced AGENTS to an operational contract.
- Reconciled README, current state, next task, blockers, and failures.
- Added structured release-evidence schema.
- Added repeatable harness and code-health scripts.
- Added CONTRIBUTING, CODEOWNERS, and Dependabot config.
- Remediated the harness-script Node warning found during `npm run code-health`.

## Not remediated

- No broad refactor of large modules was performed.
- No applied migrations were modified.
- No repository visibility change was made.
- No product modules were added.
- Branch protection could not be verified/enabled with current API access.
