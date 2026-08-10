# Recent Failures

## Active recent failures

None currently active.

## Historical failures retained for context

### PR #45 dependency audit failure

Status: resolved.

Evidence: dependency audit failed during Phase 2A release and was resolved by patching Next/PostCSS/Sharp/transitive dependency resolution. Later validation reported `npm audit --audit-level=moderate` with 0 vulnerabilities.

### Authentication redirect/setup-state failures

Status: resolved for the tested setup path.

Evidence: earlier Supabase hosted confirmation URL/configuration caused redirect/setup-state failures. Later setup testing succeeded after configuration and application fixes.

### Import API production smoke 500

Status: resolved for the tested Import API smoke.

Evidence: production Import API smoke initially returned 500 and later passed after secret/env alignment and redeploy.

## Failure classification rule

Keep active failures separate from historical resolved failures. Do not let old milestone names drive the current roadmap; use `harness/*.yaml`.
