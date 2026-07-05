# RetailOS

RetailOS is the operating system for African fashion retail: a secure, multi-tenant platform intended to help fashion retailers recover inventory value, operate stores, coordinate commerce, and make permission-aware decisions from trustworthy data.

This repository is in a **harness-first restart**. The active phase is **Phase 0 — Foundation: Inventory Recovery Intelligence**. No product application has been scaffolded and no product features, dashboards, or screens are implemented in this change.

## Current objective

This foundation establishes:

- phase control and agent working rules;
- Security Grade AAA+ requirements;
- product, security, and operational source documentation;
- validation gates and placeholder security checks;
- CI structure for lint, typecheck, test, build, and security checks;
- empty test, migration, planning, and design-handoff boundaries.

The authoritative active phase is always declared in [`reports/CURRENT_STATE.md`](reports/CURRENT_STATE.md). Agents may use the roadmap for context, but may implement only that declared phase.

## Repository map

- `docs/` — product, phase, business, delivery, and security specifications.
- `harness/` — agent workflow, validation gates, and known harness failures.
- `reports/` — current state, next task, blockers, and recent failures.
- `scripts/` — safe placeholder environment and security validations.
- `tests/` — reserved test layers; no product tests exist yet.
- `supabase/` — reserved migration boundary and setup guidance.
- `figma-handoff/` — design tokens and future implementation specifications only.

## Validation

Until a package manager and application scaffold are intentionally introduced, CI uses explicit placeholder steps and these directly executable checks:

```bash
node scripts/verify-env.ts
node scripts/security/no-service-role-client.ts
node scripts/security/no-static-dashboard-data.ts
node scripts/security/no-unprotected-api-route.ts
node scripts/security/no-unscoped-supabase-query.ts
node scripts/security/verify-rls-policies.ts
```

See [`AGENTS.md`](AGENTS.md) before making changes.
