# RetailOS Agent Workflow

## Source order

Agents must resolve work from canonical sources first:

1. `harness/roadmap.yaml`
2. `harness/milestones.yaml`
3. `harness/quality-gates.yaml`
4. `harness/human-gates.yaml`
5. `reports/CURRENT_STATE.md`
6. `reports/NEXT_TASK.md`
7. code, migrations, tests, CI, deployment evidence

## Workflow

If the user says `continue autonomously`, continue through already-approved canonical milestones until a stop condition or human gate is reached.

1. Confirm active phase and approved milestone.
2. Inspect implementation, migrations, tests, Git history, open PRs, CI, deployment, blockers, and failures.
3. Identify acceptance criteria, validation requirements, risk tier, required reviewers, and human gates from `harness/milestones.yaml`.
4. Implement only the approved scope.
5. Run required validation from `harness/quality-gates.yaml`.
6. Record evidence using structured release evidence where possible.
7. Open a PR, wait for CI/preview, merge only when policies permit.
8. Verify production only when runtime behavior changes.
9. Update canonical state and reports.
10. Stop at mandatory human or technical gates.

## Role separation

The builder cannot self-certify acceptance. Required roles are defined in `harness/quality-gates.yaml`:

- `BUILDER`
- `REPOSITORY_REVIEWER`
- `DOMAIN_REVIEWER`
- `SECURITY_REVIEWER`
- `RELEASE_VERIFIER`
- `HUMAN_APPROVER`

## Evidence separation

Evidence classes are defined in `harness/quality-gates.yaml`. One class does not silently substitute for another. Production availability smoke does not prove authenticated workflow acceptance.
