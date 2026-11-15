# RetailOS — Claude Code Transfer Pack

Status: verified handoff baseline, not an implementation-phase switch  
Prepared: 2026-11-15 (Africa/Lagos)  
Repository: https://github.com/Smart-OS-erp/retailos  
Verified `main`: `23216fac1971930dbeea51f70a39a947ba3c34b2`

## 1. How Claude Code must use this

This transfers the existing build. It does not restart RetailOS, certify unfinished modules, or authorize work outside the current gate.

Read first, in order:

1. `AGENTS.md`
2. `harness/roadmap.yaml`
3. `harness/milestones.yaml`
4. `harness/quality-gates.yaml`
5. `harness/human-gates.yaml`
6. `reports/CURRENT_STATE.md`
7. `reports/NEXT_TASK.md`
8. `reports/OPEN_BLOCKERS.md`
9. this handoff

The repository is authoritative for implemented behavior. Labels in this document mean:

- **VERIFIED:** observed in code, GitHub, commands, or recorded deployment evidence.
- **PREVIOUSLY VERIFIED:** supported by dated evidence but not rerun now.
- **FOUNDER DIRECTION:** approved product objective, not proof of implementation.
- **PROPOSED:** needs a product, architecture, domain, security, or human decision.
- **BLOCKED:** a named gate prevents acceptance.

## 2. Product mandate and phase authority

### Founder direction

RetailOS is intended to become **The Intelligent Fashion Retail ERP**: a multi-tenant operating platform for African fashion retailers combining trustworthy transactions with a supervised retail analyst.

- **RetailOS ERP:** run the business and maintain authoritative records.
- **RetailOS Analyst:** explain performance, identify exceptions, recommend action, and preserve decision/outcome evidence.

The founder's launch contract is that every committed ERP and intelligence module must be complete before public launch. Private demos and retailer validation may occur during development, but the current synthetic demo or any subset must not be presented as the finished suite. RetailOS must remain usable when AI is unavailable.

### Current repository contract

The canonical harness currently stops after M2.11 and before M2.12. It prohibits Phase 2C, purchasing, WMS, omnichannel, POS, finance, wholesale, payments, and other future modules without a reviewed phase change.

These positions can coexist: the full suite is the end-state direction; `reports/CURRENT_STATE.md` remains the implementation switch. The expanded mandate needs a governance PR before new modules start. Security, domain, migration, destructive-operation, and production gates remain mandatory. This handoff does not silently start M2.12 or activate all 20 modules.

## 3. Verified repository status

| Item | State |
| --- | --- |
| Repository | `Smart-OS-erp/retailos` |
| Visibility | Public |
| Default branch | `main` |
| Current main | `23216fac` — Close pre-M2.12 technical gaps for Aso demo (#61) |
| PR #61 | Merged; merge-time Quality, Security, and Vercel checks passed |
| Active campaign | Phase 2B — Engineering Reconciliation, Domain Validation and Pilot Readiness |
| Accepted campaign range | M2.7–M2.11 |
| Exact next milestone | M2.12 — Retail Domain Validation |
| M2.12 | Not started; not accepted |
| Production | https://retailos-ten.vercel.app |
| Hosted synthetic tenant | Aṣọ Collective, `ASO_MERCHANDISING_PILOT_V3` |
| Runtime stack | Next.js App Router, React, TypeScript, Supabase Auth/PostgreSQL/RLS |
| Repository migrations | 20 SQL migrations |
| Measured code baseline | 213 source/test/script files; 31,370 lines on 2026-08-10 |

### Current reliability warning

The August baseline passed at merge time, but scheduled `Security` workflows now fail. The 2026-11-09 run reported 22 dependency vulnerabilities: 11 moderate, 10 high, and 1 critical. Advisories include the installed Next.js range and transitive packages. This is a current release blocker.

Open Dependabot PRs #64–#69 are not accepted fixes. Several fail Security; #66 and #69 also fail Quality. Do not merge them as a batch or run `npm audit fix --force` without reviewing breakage.

A fresh local run also found one test regression: 148 of 149 tests passed, while `tests/integration/phase0-end-to-end-acceptance.test.ts` expected the Copilot summary to contain the literal word `evidence`. The actual deterministic summary was `Review aged inventory recovery is in progress at workflow version 4.` Treat this as unresolved contract/test drift until the intended copy contract is decided and fixed.

## 4. What this ChatGPT/Codex build completed

### Harness and secure foundation — PRs #1–#3

- operating manual, harness, plans, reports, documentation, CI, and security workflows;
- environment contract with ignored local secret files;
- Next.js/Supabase foundation;
- authentication, organizations, memberships, roles, location scope, and RLS foundations;
- environment/security validation scripts and initial hosted verification.

### Phase 0 inventory recovery foundation — PRs #4–#9

- signup, login, confirmation, organization creation, and onboarding;
- company, location, brand, team, and data-source steps;
- upload, staging, validation, consolidation, and data health;
- entities, brands, locations, products, SKUs, inventory positions/snapshots, and sales facts;
- risk insights, recovery opportunities, projects, tasks, approvals, and campaign briefs;
- deterministic Copilot views and role-aware workspaces;
- onboarding fixes, hosted schema evidence, and acceptance governance.

Phase 0 remains **CONDITIONALLY_ACCEPTED**. Authenticated synthetic browser/production evidence later closed two conditions. Consultant review, retailer validation, and migration reproducibility remain open.

### Integration/data foundation (historical Phase 0.5) — PRs #10–#38

- Integration Hub data sources, sync jobs, external records, mappings, normalization, errors, webhooks, and idempotency;
- protected Import API credentials/route, diagnostics, and production evidence;
- Shopify and WooCommerce MVP workers;
- protected scheduled sync and provider credential verification;
- approval flows for external records;
- automatic intelligence recalculation after normalized imports;
- setup UI and migration-bundle tooling.

Not complete: Google Sheets MVP, broad POS/ERP connectors, full provider observability/reconciliation, product publishing, and order/fulfilment sync.

### Shared UI foundation — PRs #29, #32, #33

Shared shell/design primitives and operational pages exist. They do not prove the complete premium ERP interface. Foundation-era navigation, KPIs, statuses, roles, and demo records remain replaceable until validated.

### Phase 1 inventory core — PRs #39–#44

- inventory ledger and movement history;
- adjustments;
- transfer requests/items and discrepancy foundations;
- stock counts and count items;
- reconciliation issues, audit events, search, and watchlist;
- location-scoped operations and visible workflow/deployment evidence.

This does not complete reservations, valuation, WMS, purchasing, orders, finance, or offline POS.

### Phase 2A merchandising — PRs #45–#47

- productivity metrics and performance views;
- merchandising recommendations;
- markdown drafts;
- assortment items and planning cycles;
- directional actions that do not execute sensitive changes;
- hosted schema/deployment evidence.

This is light merchandising intelligence, not the complete planning and execution suite.

### Aṣọ data and acceptance evidence — PRs #48–#51

- deterministic Aṣọ synthetic datasets V1–V3;
- five-location structure;
- seed, verify, reset, and cleanup lifecycle;
- golden outcomes and production evidence.

Synthetic fixtures are an engineering/interim domain baseline, not customer, pilot, causal, or commercial proof.

### Governance and pre-M2.12 closure — PRs #52–#61

- canonical roadmap, milestones, quality gates, and human gates;
- branch protection, CODEOWNERS, Dependabot, and release discipline;
- senior SWE/code-health reports;
- M2.11 Aṣọ expansion;
- business-rule registry and SQL/TypeScript parity/discrepancy tests;
- strategic product invariants;
- hosted Aṣọ provision/verify scripts and authenticated desktop/mobile smoke;
- M2.12 review packet and technical-closure report.

PR #61 is merged into `main`.

## 5. Current capability inventory

### Identity/administration foundations

Implemented: Supabase Auth, organizations, memberships, roles, locations, assignments, onboarding, audit events, RLS, and security tests.

Missing for full suite: workforce administration, broad configurable approvals, billing, enterprise controls, and revalidation across future modules.

### Product/master-data foundations

Implemented: brands, categories, products, SKUs, collections, locations, entities, imports, and consolidation.

Missing: photographic product master, media lifecycle, galleries, complete style/colour/size identity, durable barcodes/channel identity, pricing, bulk editing, tech packs, BOMs, samples, and revisions.

### Inventory/recovery

Implemented: positions, movements, adjustments, transfers, counts, discrepancies, reconciliation, watchlists, risk, opportunities, projects, tasks, approvals, and briefs.

Missing/incomplete: order reservations, full valuation/costing, WMS execution, replenishment execution, offline behavior, and accounting integration.

### Data/integrations

Implemented: upload/staging/validation, Import API, idempotency, provider credentials, Shopify/WooCommerce MVPs, scheduled sync, normalization, approvals, errors, webhooks, and recalculation.

Missing: Google Sheets, broad POS/payment/logistics coverage, complete production hardening, and Integration Monitor.

### Merchandising/intelligence

Implemented: productivity, recommendations, markdown drafts, planning cycles, briefings, action cards, Attention Queue, recovery intelligence, deterministic Copilot, and Aṣọ golden outcomes.

Missing: full assortment/allocation/replenishment/open-to-buy, validated forecasting, Decision Ledger, analyst evaluation, model-provider tools, and causal attribution.

### UI

Implemented routes include auth/onboarding, data, consolidation, integrations, inventory, recovery, projectisation, tasks, merchandising, Copilot, and role workspaces.

Missing: complete photographic catalogue/product detail, POS, purchasing, production, warehouse, finance, CRM, wholesale, Decision Ledger, and mature Integration Monitor experiences.

## 6. Founder 20-module coverage matrix

Statuses compare code to the complete launch definition, not historical milestone labels.

| # | Module | Status | Evidence/gap |
| ---: | --- | --- | --- |
| 01 | Administration & Organisations | PARTIAL | Auth, tenants, memberships, roles, locations, onboarding, RLS exist; full employees, approval authority, configuration, and enterprise admin do not. |
| 02 | Product Catalogue & PIM | PARTIAL | Product/SKU/brand/category/collection foundations exist; photographic PIM, rich variants/media, pricing, and bulk editing do not. |
| 03 | Product Development & PLM | NOT_STARTED | No accepted concepts, samples, revisions, tech packs, fabrics, BOMs, or PLM approval history. |
| 04 | Production & Manufacturing | NOT_STARTED | No accepted production orders, WIP, material consumption, QC, contractor, or production costing. |
| 05 | Inventory Management | PARTIAL | Strong ledger/operations/recovery core; reservations, valuation, and order/accounting integration remain. |
| 06 | Purchasing & Suppliers | NOT_STARTED | No accepted supplier master, PO, receipt, return, landed-cost, or supplier-performance system. |
| 07 | Warehouse Management | NOT_STARTED | Locations are not WMS; bins, putaway, pick/pack/dispatch, scanning, and exceptions are absent. |
| 08 | Store Operations | PARTIAL | Store workspace and inventory workflows exist; full assignments, checklists, compliance, and offline/mobile execution remain. |
| 09 | Point of Sale | NOT_STARTED | No accepted checkout, payment, till, shift, receipt, refund, or offline recovery. |
| 10 | Orders & Fulfilment | NOT_STARTED | No accepted order, reservation, allocation, delivery, return, exchange, or refund core. |
| 11 | Ecommerce & Omnichannel | PARTIAL | Shopify/WooCommerce ingestion exists; publishing, orders, stock consistency, and fulfilment remain. |
| 12 | Merchandising | PARTIAL | Collections, metrics, recommendations, and drafts exist; full assortment boards, clustering, range/allocation execution remain. |
| 13 | Planning & Replenishment | PARTIAL | Planning cycles exist; forecasting, OTB, allocation, replenishment, targets, and scenarios remain. |
| 14 | Pricing & Promotions | PARTIAL | Markdown drafts/briefs exist; price lists, dated price changes, promotions, discount governance, and execution remain. |
| 15 | Finance & Accounting | NOT_STARTED | No accepted GL, AR/AP, balanced journals, COGS, valuation, tax, reconciliation, FX, or close. |
| 16 | CRM & Customer Management | NOT_STARTED | No accepted profiles, consent, segmentation, loyalty, or clienteling. |
| 17 | Wholesale & B2B | NOT_STARTED | No accepted accounts, line sheets, B2B pricing/orders, consignment, or allocations. |
| 18 | Retail Intelligence & Copilot | PARTIAL | Deterministic recovery intelligence and explanations exist; full analyst ladder, model tools, investigations, and scenarios remain. |
| 19 | Decision & Outcome Ledger | NOT_STARTED | Projects/audit logs are not the proposed recommendation–decision–execution–observation–attribution ledger. |
| 20 | Platform, Integrations & Monitoring | PARTIAL | CI, Vercel, APIs, jobs, and two provider MVPs exist; billing, broad observability, backup/recovery, support tools, and monitor remain. |

## 7. Reference retailers

### Aṣọ Collective

Existing synthetic tenant for an established retailer. Preserve and enrich its five locations: Lagos Island Flagship, Lekki, Abuja, Ibadan, and Ecommerce Pool. Current support is strongest for inventory, recovery, integration, and light merchandising. Complete purchasing, receiving, POS, orders, accounting, and outcome-ledger cycles do not exist.

### CTRL

Founder direction introduces a separate synthetic streetwear tenant for design, sourcing, production, limited drops, pop-ups, fulfilment, and profitability. CTRL is **not implemented**. Its brand, artwork, products, and imagery must be original. Do not build it before the relevant phase is approved.

## 8. Business-rule and analyst honesty

Read `docs/domain/BUSINESS_RULE_CONTRACT.md`, `src/lib/business-rules/rule-registry.ts`, `src/lib/business-rules/retail-rules.ts`, `reports/BUSINESS_RULE_RECONCILIATION.md`, and `tests/integration/business-rule-database-parity.test.ts`.

Pre-M2.12 work proved selected available-inventory parity and classified historical SQL 90-day sell-through versus canonical v0.9 net sell-through as different versioned formulas. Do not silently rewrite applied migrations.

Forecasts are not facts. Proposed recovery is not realised recovery. Observed improvement is not automatically attributable. Synthetic golden outcomes are not retailer proof.

## 9. Founder specifications not yet implemented

### Decision & Outcome Ledger

Keep `Human Preference != Observed Outcome != Credible Attribution`. Proposed entities are `recommendations`, `decisions`, `executions`, `observations`, `attributions`, and versioned `attribution_methods`. Current state should derive from append-only evidence. This is not accepted or migrated.

### Analyst Capability Ladder

Proposed levels: Reporting, Diagnostic, Decision Support, Honest, and Operating Analyst. Outputs must be permission-aware, source-grounded, explicit about freshness/rules/uncertainty, and independently evaluated. The full ladder and rubric are not implemented. Agents cannot self-certify domain quality.

## 10. Architecture decision

Verified architecture: Next.js/React/TypeScript, Supabase Auth/PostgreSQL/RLS, SQL migrations/views/functions, server actions, Vitest/PGlite/Playwright, GitHub Actions, and Vercel.

Do not migrate immediately. Compare:

- **A:** retain a custom PostgreSQL transaction core and current TypeScript app;
- **B:** reuse an ERP engine, especially ERPNext if licensing/tenancy permit, while retaining RetailOS UI, fashion identity, intelligence, and decision history.

Test style/colour/size/media, PO-to-receipt/valuation, POS-to-accounting, transfer discrepancies, CTRL manufacturing, tenant/location isolation, Nigeria/Ghana requirements, licensing, operations, migration risk, and cost.

Neon, Better Auth, Drizzle, Cloudflare R2, Trigger.dev, Sentry/OpenTelemetry, and model abstractions are candidates, not approved replacements. R2 is media storage, not the ERP database. Founder approval and rollback planning are mandatory.

## 11. Supabase migration blocker

Verified on 2026-08-10: 20 repository migrations, 9 hosted history rows, key later relations present, CLI account lacked target access, and Docker/Podman was unavailable.

Do not replay blindly, fabricate history, or edit applied migrations. Safely:

1. authenticate an authorized CLI account;
2. inspect hosted schema/history read-only;
3. classify every migration as applied, partial, absent, or divergent;
4. back up and document rollback;
5. repair official history only for proven applied migrations;
6. use new expand/contract migrations for divergence;
7. install Docker/Podman and prove clean reset;
8. rerun integration, RLS, parity, and hosted smoke;
9. record evidence.

This is a mandatory stop for risky schema expansion.

## 12. Security and release state

Implemented controls include secret checks, ignored env files, RLS/scope, API protection checks, audit logging, CI/security workflows, branch protection, Dependabot, and vulnerability alerts.

Reproduce the red dependency audit on a clean install, inspect paths with `npm explain`, update the smallest coherent groups, retain ESLint 9 until ESLint 10 compatibility is proven, run full validation/browser smoke, and open focused PRs. Never waive high/critical findings silently.

## 13. Demo and validation evidence

Previously verified on 2026-08-10: production Ready; idempotent Aṣọ provisioning; authenticated verification; desktop/mobile Playwright smoke; five locations, six balances, two recommendations, and one markdown draft.

Pre-M2.12 closure passed diff check, harness, code health, lint, typecheck, all/unit/domain/integration/security tests, security scripts, build, audit, demo lifecycle, and hosted smoke. Recorded totals: 33 files/149 tests; unit 22/84; domain 1/4; integration 9/57; security 1/4.

Current handoff verification on 2026-11-15:

- `npm run harness:validate` passed;
- `npm run lint` passed;
- `npm run typecheck` passed;
- `npm run test` failed 1 of 149 tests on the Copilot summary contract described above;
- `npm run security` passed all repository security scripts;
- `npm run build` passed and emitted 63 application routes;
- `npm audit --audit-level=moderate` failed locally with 21 vulnerabilities: 10 moderate, 10 high, and 1 critical;
- the 2026-11-09 scheduled audit reported 22 because the advisory/lockfile resolution differed at that run.

Do not reuse the August zero-vulnerability or all-tests-green result as current evidence.

Demo credentials are secrets. Obtain or rotate them through ignored local storage or a secret manager. Never place them in prompts, commits, logs, screenshots, or client code.

## 14. Open blockers

| Item | State | Required action |
| --- | --- | --- |
| Dependency audit | BLOCKED | Engineering/security: safe upgrades and green workflow. |
| Phase 0 acceptance test drift | BLOCKED | Engineering/product: decide whether summary copy or assertion is authoritative; fix and rerun all tests. |
| Migration history | BLOCKED | Authorized Supabase owner + engineering: inspect, back up, repair, prove reset. |
| Local database reset | BLOCKED | Install Docker/Podman after reconciliation plan. |
| M2.12 domain validation | BLOCKED | Original consultant or approved independent domain reviewer. |
| Real retailer pilot | BLOCKED | Founder/product/domain approval and evidence protocol. |
| Full-suite roadmap | NOT CANONICAL | Governance PR must reconcile founder mandate with existing evidence/gates. |
| Architecture | UNDECIDED | Founder decision after evidence-backed ADR. |
| CTRL, Ledger, Analyst Ladder | NOT_STARTED | New approved milestones and independent review. |

## 15. Do not claim these are done

Full ERP, launch readiness, M2.12, consultant/customer validation, migration reproducibility, current green security, photographic PIM, PLM, manufacturing, purchasing, WMS, POS, orders, finance, CRM, wholesale, CTRL, complete analyst, Decision Ledger, or causal recovery proof.

## 16. Review of the uploaded founder handoff

Preserve: product identity, complete-before-launch contract, Aṣọ/CTRL, 20-module register, photographic identity, ERP independence from AI, supervised analyst, Decision Ledger separation, Nigeria/Ghana focus, architecture comparison, and business-cycle acceptance.

Correct: PR #61 is merged; `23216fac` is current; the repository still stops before M2.12; Security is currently red; Supabase is still actual architecture; Aṣọ is synthetic; CTRL is absent; Ledger/Ladder are specifications; product/SKU tables are not photographic PIM; inventory locations are not WMS/POS/accounting.

Remove from the executable prompt: duplicate mandates/numbering, embedded third-party images/tracking URLs, replacing the harness before inspection, completion claims based on screens/milestone names, and unrestricted autonomous production access.

## 17. Recommended transfer sequence

### A — restore trust

Verify main/open PRs; fix dependencies in focused PRs; restore checks; reconcile migrations non-destructively; prove clean reset and rerun schema/RLS/integration tests.

### B — reconcile product authority

Turn the 20-module direction into a concise product contract; compare with the canonical harness; preserve evidence; change only obsolete stops; retain risk gates; explicitly decide whether M2.12 remains next.

### C — decide architecture

Produce the custom-core versus ERPNext ADR with executable scenarios, consequences, and reversible plan. Wait for founder approval.

### D — first approved user-facing vertical

After A–C and phase approval, build the photographic Product Catalogue/PIM linking tenant scope, style, colourway, size, SKU, barcode, collection, secure media, location stock, import/edit/audit, accessible UI, and full tests. Do not fabricate CTRL operations.

## 18. Paste-ready first Claude Code prompt

> Continue the existing RetailOS repository; do not restart or scaffold a parallel app. Read `AGENTS.md`, the canonical harness, current reports, blockers, and `docs/CLAUDE_CODE_COMPLETE_HANDOFF.md`. Verify Git, PRs, CI, dependency audit, migrations, Supabase access, deployment, tests, and routes from evidence. Distinguish verified code from founder direction and proposals. Do not begin M2.12, future modules, destructive migrations, architecture replacement, or production changes until their gates are satisfied. First return: (1) repository status; (2) the 20-module evidence matrix; (3) exact audit causes and safe remediation; (4) non-destructive Supabase reconciliation; (5) a custom PostgreSQL versus ERPNext ADR plan; (6) minimal harness changes needed to canonicalize the founder's full-suite launch direction; and (7) the first small executable PR with acceptance criteria. Never manufacture tests, domain validation, or customer evidence.

## 19. Access and secrets

Claude may need the clone, GitHub, authorized Supabase access, Vercel, approved local env variables, later Cloudflare/media access, provider sandboxes, reviewed design references, and independent retail/accounting evidence.

Never paste or commit `.env`, `.env.local`, `.env.*.local`, service-role keys, database URLs, import secrets, demo passwords, or provider tokens.

## 20. Completion standard and bottom line

A module needs evidence for workflows, schema/transactions/reconciliation, integrations, usable accessible UI, tenant/RBAC/approval/audit controls, idempotency/concurrency/retry/reversal behavior, accurate reports, tests, independent review of material rules, and deployment/migration/backup/recovery. A screen, static dashboard, synthetic result, unit test, or merged PR is not enough alone.

RetailOS is not blank. It has a secure multi-tenant foundation, ingestion/integrations, inventory recovery, a Phase 1 inventory core, light merchandising, UI foundations, synthetic Aṣọ data, governance, tests, and a deployed authenticated demo.

It is not the complete Intelligent Fashion Retail ERP. Current blockers are dependency security, migration reproducibility, domain validation, and unselected transaction architecture. Most of the 20-module target is partial or not started. Restore a green reproducible baseline, canonicalize the expanded mandate, decide architecture with evidence, then build the photographic product master as the first approved cross-module vertical.
