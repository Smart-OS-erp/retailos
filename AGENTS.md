# RetailOS Agent Contract

## 1. Mission

RetailOS is the operating system for African fashion retail. Its mission is to help fashion businesses turn fragmented inventory, sales, customer, supplier, workforce, and financial information into secure daily operating decisions. It must work for the realities of African retail: multi-location operations, intermittent connectivity, mobile-first teams, varied payment and fulfilment workflows, fast-changing fashion demand, and strict separation between independent businesses. The first value delivered is inventory recovery intelligence—finding trapped stock value and making the next safe action understandable—without pretending that unverified data is truth.

## 2. OS roadmap

The roadmap provides context, not blanket implementation authority.

1. **Phase 0 — Foundation: Inventory Recovery Intelligence (active):** establish the engineering and security foundation, ingest trustworthy inventory context, identify ageing/slow/dead stock, explain recovery opportunities, and prepare permission-aware actions. This harness change contains no product implementation.
2. **Phase 1 — Secure Retail Core (future):** product catalogue, variants, locations, inventory ledger, stock movements, sales foundations, and operational controls.
3. **Phase 2 — Omnichannel Commerce and Fulfilment (future):** connected selling channels, orders, reservations, transfers, returns, delivery, and customer notifications.
4. **Phase 3 — Procurement and Financial Operations (future):** suppliers, purchase planning, receiving, landed cost, cash visibility, reconciliation, and management reporting.
5. **Phase 4 — Customer and Workforce OS (future):** consented customer intelligence, loyalty, clienteling, tasks, scheduling, approvals, and performance workflows.
6. **Phase 5 — Intelligence Platform and Ecosystem (future):** permission-aware Copilot, forecasting, automation, partner integrations, APIs, and extensibility across the retail network.

Future phases may be documented to preserve architectural compatibility. They must not be scaffolded, simulated, or implemented until activated.

## 3. Active phase control rule

`reports/CURRENT_STATE.md` is the sole implementation phase switch. Before changing code, read it. An agent may understand and document the full roadmap, but may only implement the phase declared there. If a request conflicts with the declared phase, stop and report the phase-gate conflict. Changing the active phase requires an explicit human-approved update to `reports/CURRENT_STATE.md`.

## 4. Security Grade AAA+ rule

Every design and implementation must target RetailOS Security Grade AAA+:

- tenant isolation is the default, not an optional filter;
- every tenant-owned Supabase table has enabled and tested RLS;
- RBAC is enforced consistently in UI, API, and database layers;
- service-role credentials never enter browser code;
- secrets are never committed, logged, exposed to previews, or placed in public variables;
- uploads are allowlisted, size-limited, tenant-scoped, stored with non-guessable keys, and scanned or quarantined where risk requires it;
- Copilot retrieves and acts only within the caller's effective permissions, with auditable tool use;
- security tests are completion requirements, not follow-up work.

When the secure choice is unclear, fail closed and record the blocker.

## 5. Harness engineering standard

Changes must be small, reviewable, reproducible, and evidence-backed. Prefer explicit contracts over hidden convention. Do not claim a check passed unless it ran. Placeholder checks must identify themselves as placeholders and either fail safely when a guarantee cannot be made or print an actionable TODO when the relevant implementation does not yet exist. Keep business rules separate from presentation, tenant scope explicit at data boundaries, and generated artifacts out of source control unless required.

## 6. Agent workflow

1. Read `reports/CURRENT_STATE.md`, `reports/NEXT_TASK.md`, relevant documentation, and `harness/KNOWN_FAILURES.md`.
2. Confirm the requested work belongs to the active phase and state the intended scope.
3. Inspect the working tree and preserve unrelated changes.
4. Create or update a focused plan when work spans multiple concerns.
5. Implement the smallest complete vertical change; do not fill gaps with fake product data or inert UI.
6. Run the validation commands required by the affected gate.
7. Update reports and documentation when state, decisions, blockers, or failures change.
8. Review the diff for secrets, tenant-scope regressions, unprotected routes, misleading placeholders, and phase leakage.
9. Commit only in-scope files and open a reviewable PR.

## 7. Phase gates

- **Gate 0 — Intent:** active phase and task scope agree.
- **Gate 1 — Architecture:** tenant boundaries, trust boundaries, data ownership, and failure modes are documented.
- **Gate 2 — Security:** threat model controls, RBAC/RLS strategy, secret handling, uploads, APIs, and Copilot constraints are satisfied and tested where implemented.
- **Gate 3 — Quality:** lint, typecheck, unit, integration, e2e, security, and build checks appropriate to the implementation pass.
- **Gate 4 — Product acceptance:** acceptance tests for the active phase pass with traceable evidence and no static or fabricated production behavior.
- **Gate 5 — Release readiness:** deployment, rollback, observability, incident response, migrations, and open blockers are reviewed.

No gate may be waived silently. During this harness-only change, product-dependent gates are marked not applicable rather than falsely passed.

## 8. Hard prohibitions

- Do not implement a phase not declared active.
- Do not build product features, a full app scaffold, dashboards, or UI screens during this harness-first change.
- Do not use static dashboard data, fabricated analytics, fake success responses, or mock security guarantees as product behavior.
- Do not bypass RLS with a service role for normal user requests.
- Do not put service-role keys, secrets, privileged tokens, or sensitive tenant data in client bundles, logs, fixtures, screenshots, prompts, or commits.
- Do not query or mutate tenant data without explicit organization scope and authorization.
- Do not create unprotected API routes, permissive wildcard authorization, or public storage buckets for tenant documents.
- Do not let Copilot infer permissions, cross tenant boundaries, execute unapproved high-impact actions, or train on tenant data by default.
- Do not mark incomplete, skipped, placeholder, or unrun validation as passing.

## 9. Minimum validation commands

Run all commands available for the current repository state:

```bash
node scripts/verify-env.ts
node scripts/security/no-service-role-client.ts
node scripts/security/no-static-dashboard-data.ts
node scripts/security/no-unprotected-api-route.ts
node scripts/security/no-unscoped-supabase-query.ts
node scripts/security/verify-rls-policies.ts
```

Once the application scaffold defines package scripts, also run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 10. Final response format

Every implementation handoff must report, in this order:

1. **Outcome** — concise statement of what changed.
2. **Repository** — repository link.
3. **Branch** — branch name and link.
4. **Pull request** — PR link and draft/ready state.
5. **Files created or changed** — grouped summary, not an ambiguous count alone.
6. **Validation** — exact commands run and their outcomes, including placeholders or skipped checks.
7. **Blockers** — open blockers and the required owner/action; say `None` only when verified.
8. **Next step** — the phase-gated next action from `reports/NEXT_TASK.md`.
