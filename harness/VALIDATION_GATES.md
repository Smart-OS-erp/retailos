# RetailOS Validation Gates

Canonical quality gates are defined in `harness/quality-gates.yaml`.

## Required command baseline

Run all repository-supported commands relevant to the change:

```bash
git diff --check
npm run harness:validate
npm run lint
npm run typecheck
npm run test
npm run test:unit
npm run test:integration
npm run test:security
npm run security
npm run build
npm audit --audit-level=moderate
```

For Aso Collective fixture or demo logic changes:

```bash
npm run demo:seed
npm run demo:verify
npm run demo:reset
npm run demo:cleanup
```

## Acceptance rule

A milestone cannot be accepted by the builder alone. Acceptance requires the required reviewer/evidence classes in `harness/milestones.yaml`.

## Migration gate

Applied migrations are immutable. Migration history disagreement is a technical stop. Destructive migrations require a human gate.
