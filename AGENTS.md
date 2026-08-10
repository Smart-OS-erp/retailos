# RetailOS Agent Operating Contract

## Product identity

RetailOS is secure operating intelligence for African fashion retail. It helps retailers turn fragmented inventory, sales, location, integration, and merchandising data into trusted operating decisions.

RetailOS is not a generic ERP, POS, accounting system, static dashboard, or chatbot. Product principles and domain assumptions live in `docs/`, especially `docs/domain/RETAIL_OPERATING_MODEL_V0_9.md`.

## Authoritative sources

Use this precedence order:

1. `harness/roadmap.yaml`
2. `harness/milestones.yaml`
3. `harness/quality-gates.yaml`
4. `harness/human-gates.yaml`
5. `reports/CURRENT_STATE.md`
6. `reports/NEXT_TASK.md`
7. code, migrations, tests, CI, and deployment evidence
8. supporting docs in `docs/`, `reports/`, and `plans/`

Do not duplicate the full roadmap into prompts or prose docs. Preserve historical labels such as Phase 0.5 only as history when they appear in migrations and reports.

## Current phase control

The active work must match the canonical harness files and `reports/CURRENT_STATE.md`.

Current approved campaign: Phase 2B — Engineering Reconciliation, Domain Validation and Pilot Readiness.

Approved campaign scope: M2.7, M2.8, and M2.9 only.

Stop after M2.9. Do not begin M2.11 or later without explicit approval.

## Autonomy contract

## AUTONOMOUS CONTINUATION COMMAND

The command `continue autonomously` is a persistent repository command. It means continue through the next eligible canonical milestone without asking for permission between already-approved milestones.

When instructed to proceed autonomously:

1. Read this file and the canonical harness YAML.
2. Inspect `reports/CURRENT_STATE.md`, `reports/NEXT_TASK.md`, blockers, failures, Git history, open PRs, CI, migrations, deployment state, and runtime errors where accessible.
3. Resolve the next eligible milestone from the canonical sources.
4. Implement only that milestone.
5. Run validation appropriate to the change.
6. Open a PR, wait for CI/preview, merge only when policies permit, and record evidence.
7. Continue only until the approved stop condition or a mandatory human/technical gate.

The builder supplies evidence but cannot self-certify milestone acceptance.

## Security invariants

- Tenant isolation is mandatory.
- RBAC must be enforced in UI, API, and database layers where implemented.
- Supabase RLS must protect tenant tables.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, tokens, and real secrets must never enter browser/client code or commits.
- Normal user requests must not bypass RLS with service-role access.
- Public API routes must be explicitly allowlisted and justified.
- Uploads and imports must be tenant-scoped and fail closed.
- Copilot must consume permissioned deterministic evidence; it must not become the authoritative calculation engine.
- High/critical security issues block release unless a human-approved exception exists.

## Engineering invariants

- Applied migrations are immutable.
- Prefer expand-contract migrations.
- Destructive migrations require a human gate.
- Production app rollback does not imply database rollback.
- Migration history disagreement is a technical stop.
- Important business rules need one authoritative implementation.
- Do not introduce fake working flows, fake analytics, fake validation, or static final product data.
- Do not build Phase 2C, Phase 3, purchasing, WMS, omnichannel, POS, finance, wholesale, payments, or other new modules unless explicitly approved.
- Do not change repository visibility without explicit human approval.

## Risk routing

Roles are defined in `harness/quality-gates.yaml`:

- `BUILDER`
- `REPOSITORY_REVIEWER`
- `DOMAIN_REVIEWER`
- `SECURITY_REVIEWER`
- `RELEASE_VERIFIER`
- `HUMAN_APPROVER`

Evidence classes are defined in `harness/quality-gates.yaml`:

- `STATIC`
- `UNIT`
- `INTEGRATION`
- `DATABASE`
- `SECURITY`
- `BROWSER`
- `PRODUCTION`
- `DOMAIN`
- `HUMAN`
- `COMMERCIAL`

One evidence class must not silently substitute for another. A production route returning `307` is production availability evidence, not authenticated production workflow acceptance.

## Mandatory stop conditions

Stop and report exact evidence if any of these occur:

- failed tenant/location isolation test;
- double-posted inventory/financial/workflow effect;
- migration history disagreement;
- modified already-applied migration;
- destructive migration requirement;
- production data risk;
- unavailable backup or rollback path for a risky operation;
- critical/high unresolved security issue;
- broken GitHub Actions, Vercel integration, deployment, or production smoke;
- real retailer data in synthetic/demo paths;
- unexplained deterministic calculation mismatch;
- missing required external credentials or infrastructure access;
- insufficiently defined next milestone.

Human gates are canonical in `harness/human-gates.yaml`.

## Required commands

Run all supported commands relevant to the change:

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

For Aso Collective dataset changes, also run:

```bash
npm run demo:seed
npm run demo:verify
npm run demo:reset
npm run demo:cleanup
```

If a command cannot run, record why. Do not mark it passed.

## Final response format

Use:

```text
Status:
Implemented:
Verified:
Not Verified:
Security Notes:
Known Blockers:
Files Changed:
Commands Run:
GitHub:
Deployment:
Next Step:
```
