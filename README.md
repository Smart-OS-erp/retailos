# RetailOS

RetailOS is the operating system for African fashion retail: a secure, multi-tenant platform intended to help fashion retailers recover inventory value and turn trustworthy retail data into permission-aware daily operating decisions.

This repository is in a **harness-first restart**. The active phase is **Phase 0 — Foundation: Inventory Recovery Intelligence**. This change contains no product application scaffold, features, dashboards, or UI screens.

## Current objective

This foundation establishes:

- the RetailOS agent operating manual and active-phase control;
- Security Grade AAA+ requirements and security documentation;
- product, design, data, deployment, and operational source documentation;
- validation gates and honest placeholder security checks;
- CI structure for future lint, typecheck, test, build, and security validation;
- empty test, migration, planning, and design-handoff boundaries.

The authoritative active phase is always declared in [`reports/CURRENT_STATE.md`](reports/CURRENT_STATE.md). Agents may use the roadmap for context, but may implement only the declared phase.

## Repository map

- `docs/` — product, phase, business, delivery, and security specifications.
- `harness/` — agent workflow, validation gates, and known harness failures.
- `reports/` — current state, next task, blockers, and recent failures.
- `scripts/` — safe placeholder environment and security validations.
- `tests/` — reserved test layers; no product tests exist yet.
- `supabase/` — reserved migration boundary and setup guidance.
- `figma-handoff/` — documentation-only design tokens and future implementation specifications.

## Validation

Until a package manifest and application scaffold are intentionally introduced, CI records quality commands as not applicable and runs these directly executable checks:

```bash
node scripts/verify-env.ts
node scripts/security/no-service-role-client.ts
node scripts/security/no-static-dashboard-data.ts
node scripts/security/no-unprotected-api-route.ts
node scripts/security/no-unscoped-supabase-query.ts
node scripts/security/verify-rls-policies.ts
```

Placeholder success means the relevant product surface does not exist; it is not evidence that a future implementation is secure.

Read [`AGENTS.md`](AGENTS.md) before making changes.
