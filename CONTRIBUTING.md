# Contributing to RetailOS

RetailOS is a production SaaS codebase for African fashion retail operating intelligence. Contributions must preserve tenant isolation, explicit phase control, and evidence-backed release discipline.

## Branch strategy

- `main` is the production branch.
- Work branches should use `agent/<short-scope>` or a human-approved equivalent.
- Every non-trivial change must go through a pull request.
- Do not force-push shared branches unless correcting a PR branch before review and the risk is understood.
- Do not change repository visibility without explicit human approval.

## Pull request expectations

Every PR must state:

- scope and active milestone;
- what changed;
- what did not change;
- validation commands run;
- security/data impact;
- migration impact;
- deployment impact;
- remaining blockers.

Keep PRs small enough for a senior engineer to review. If a change spans unrelated concerns, split it.

## Review expectations

The builder must not self-certify milestone acceptance. Use these roles:

- `BUILDER`: implements the change and supplies evidence.
- `REPOSITORY_REVIEWER`: reviews architecture, maintainability, and repo hygiene.
- `DOMAIN_REVIEWER`: reviews retail assumptions, formulas, terminology, and pilot fit.
- `SECURITY_REVIEWER`: reviews tenant isolation, RBAC/RLS, secrets, API boundaries, and abuse cases.
- `RELEASE_VERIFIER`: verifies CI, migrations, deployment, smoke tests, logs, and rollback evidence.
- `HUMAN_APPROVER`: approves human-gated product, commercial, data, security, or infrastructure decisions.

One evidence class must not substitute silently for another. A route returning `307` is not authenticated production workflow acceptance.

## Migration rules

- Applied migrations are immutable.
- Prefer expand-contract migrations.
- Destructive migrations require a human gate.
- Production rollback cannot assume Vercel rollback reverses database state.
- Migration history disagreement is a technical stop.
- Supabase CLI migration-history/reset verification must be recorded when available.

## Test requirements

Run the applicable repository commands:

```bash
git diff --check
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

For Aso Collective changes, also run:

```bash
npm run demo:seed
npm run demo:verify
npm run demo:reset
npm run demo:cleanup
```

If a command cannot run, record the exact blocker. Do not report it as passed.

## Security expectations

- Never commit `.env`, `.env.local`, `.env.*.local`, secrets, service-role keys, tokens, or real retailer data.
- `SUPABASE_SERVICE_ROLE_KEY` must never be reachable from browser/client code.
- Tenant-owned data must be protected by explicit organization scope and RLS.
- Normal user requests must not bypass RLS with service-role access.
- Public API routes must be allowlisted and justified.
- High/critical security findings block release unless a human-approved exception with compensating controls exists.

## Release verification

Release evidence should be structured and tied to real artifacts:

- `commit_sha`
- `deployment_id`
- `environment`
- `migration_hash`
- `dataset_version`
- `created_at`
- `verification_type`
- `verifier`
- `result`

Prefer canonical harness state and structured evidence over one-off markdown status files.

## Rollback expectations

- Application rollback must identify the target deployment or commit.
- Database rollback must be explicit. Do not assume app rollback reverts schema or data.
- Migrations that introduce new writes must include compatibility and failure-mode notes.

## AI-agent contribution rules

- Read `AGENTS.md`, `reports/CURRENT_STATE.md`, `reports/NEXT_TASK.md`, and canonical harness YAML before editing.
- Implement only the approved active milestone.
- Do not start future phases or future product modules without explicit approval.
- Do not invent fake product behavior, fake acceptance, fake deployments, or fake domain validation.
- Keep generated or synthetic data clearly labeled.
