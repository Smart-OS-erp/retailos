# RetailOS — Agent Operating Manual

## Agent Start Here

Before every task:

1. Read `reports/CURRENT_STATE.md`.
2. Confirm the active phase and active milestone.
3. Read `reports/NEXT_TASK.md`.
4. Read the relevant acceptance, security, and architecture documents.
5. Inspect the current implementation before proposing changes.
6. Implement only the approved milestone.
7. Run all required validation.
8. Update repository reports before completion.
9. Do not claim completion without evidence.

## 0. Product Name

The demo/project name is RetailOS.

RetailOS is not necessarily the final commercial product name. Use RetailOS throughout this repository unless a later naming decision changes it.

## 1. Mission

RetailOS is the operating system for African fashion retail.

It helps fashion retailers:

- understand inventory;
- improve inventory productivity;
- recover margin;
- reduce dead stock;
- optimize merchandising decisions;
- coordinate store execution;
- connect online/offline retail data;
- eventually run inventory, merchandising, store operations, wholesale, finance, and execution workflows from one intelligent system.

RetailOS is not a generic ERP. It should feel like a retail analyst, merchandiser, inventory planner, operations manager, and business co-pilot combined into one operating system.

## 2. Core Product Insight

Fashion retailers already manually “projectise” inventory problems. They bundle slow movers, markdown aged stock, transfer products between stores, reposition products in campaigns, create capsule edits, and ask merchandisers to turn dead stock into commercial action.

RetailOS turns this manual behavior into a structured operating system.

Core loop:

```text
Messy retail data
→ validated data
→ consolidated operating view
→ inventory risk insight
→ recovery opportunity
→ projectisation plan
→ campaign brief
→ execution tracking
→ Retail Copilot explanation
```

Every screen must answer: what requires attention right now?

## 3. Target Market

Primary geography:

- Nigeria;
- Ghana;
- Kenya;
- South Africa;
- broader African fashion retail markets over time.

Target customers:

- multi-store fashion retailers;
- multi-brand retail groups;
- luxury fashion retailers;
- omnichannel fashion operators;
- streetwear brands;
- boutiques scaling into retail groups;
- retailers selling through store, web, Instagram, WhatsApp, marketplace, and pop-up channels.

Primary users:

- `ORG_OWNER`;
- `EXECUTIVE`;
- `MERCHANDISING_MANAGER`;
- `STORE_MANAGER`;
- `VIEWER`.

Future users:

- `INVENTORY_PLANNER`;
- `OPERATIONS_MANAGER`;
- `FINANCE_MANAGER`;
- `WHOLESALE_MANAGER`;
- `BUYER`;
- `ECOMMERCE_MANAGER`;
- `WAREHOUSE_MANAGER`;
- `RETAIL_ANALYST`;
- `SYSTEM_ADMIN`;
- `EXTERNAL_CONSULTANT`.

## 4. Product Category

RetailOS belongs to the category: Fashion Retail Operating Intelligence.

Long-term category: Fashion Retail OS.

RetailOS should not be positioned as generic ERP, generic POS, generic dashboard, generic AI chatbot, generic inventory tracker, accounting software, or warehouse-only software.

## 5. Current Build Discipline

The agent may understand the full RetailOS roadmap, but must only build the approved active phase and milestone.

Do not expand scope silently. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution unless explicitly approved for the active phase.

Every phase must be implemented, tested, secured, documented, deployed, and accepted before the next phase begins. The active phase must always be declared in `reports/CURRENT_STATE.md`.

## 6. Full RetailOS Roadmap

### Phase 0 — Foundation: Inventory Recovery Intelligence

Goal: create the secure SaaS foundation and prove the core wedge from upload/connect retail data to validated data, consolidated operating view, inventory risk insight, recovery opportunity, projectisation plan, campaign brief, and Retail Copilot explanation.

Phase 0 includes authentication, signup, login, organization creation, onboarding, company/location/brand/team setup, RBAC, tenant isolation, Supabase RLS, secure API patterns, audit logging, CSV upload, staging, validation, consolidation, Operating View, inventory recovery intelligence, Attention Queue, projectisation, campaign brief generation, role-aware workspaces, and deterministic/template-based Retail Copilot.

Phase 0 does not include full POS, accounting, purchase orders, supplier management, full warehouse management, advanced forecasting, automatic campaign publishing, WhatsApp integration, autonomous markdown execution, real LLM agent execution, marketplace integrations, wholesale management, or finance modules.

### Phase 0.5 — Integration Hub MVP

Goal: move RetailOS beyond manual upload into connected retail data.

Phase 0.5 includes Integration Hub, data source setup, Shopify/WooCommerce/Google Sheets connector scaffold or MVP, RetailOS Import API, scheduled sync architecture, external record storage, sync jobs, sync errors, and webhook event table.

RetailOS does not connect to “a website” directly as the primary source. It connects to the system behind the website: Shopify, WooCommerce, Magento/Adobe Commerce, BigCommerce, custom backend, POS, ERP, spreadsheet feed, or Import API.

Phase 0.5 acceptance requires users to create a data source, see connection status, trigger sync, create tenant-scoped raw external records, and run validation/consolidation/intelligence pipeline steps after sync where approved.

### Phase 1 — Core Inventory Operating System

Goal: turn RetailOS into the core inventory operating layer.

Adds inventory ledger, stock movement history, adjustments, transfers, approvals, store stock counts, warehouse/store reconciliation, audit trail, inventory search, barcode/SKU lookup, variance tracking, store inventory health, replenishment watchlist, low stock alerts, and overstock alerts.

### Phase 2 — Merchandising & Planning OS

Goal: help merchandising teams plan, buy, allocate, markdown, and improve inventory productivity.

Adds assortment planning, collection planning, buying plan support, allocation planning, replenishment recommendations, size/color curve analysis, category/brand/collection performance, markdown planning, lifecycle tracking, new arrival monitoring, repeat/reorder signals, product productivity metrics, and directional open-to-buy advisory if validated.

Forecasting may begin here but must be labeled directional unless validated with sufficient sales history.

### Phase 3 — Store Operations OS

Goal: coordinate store-level execution around inventory, merchandising, and recovery actions.

Adds store task management, daily briefing, store manager action cards, stock count workflows, transfer receiving, merchandising instructions, campaign execution checklists, visual merchandising tasks, stock issue reporting, store performance review, compliance tracking, and mobile-first store workspace.

This is not full workforce management.

### Phase 4 — Omnichannel Sales & Customer Operations

Goal: unify retail activity across store, ecommerce, Instagram, WhatsApp, and other channels.

Adds order ingestion, online/offline reconciliation, channel performance, customer/order signals, returns/refunds, discount usage, campaign performance, customer segment signals, omnichannel inventory exposure, Instagram/WhatsApp manual order import, and ecommerce connector expansion.

Do not build a full CRM too early; customer intelligence should support merchandising and inventory decisions first.

### Phase 5 — POS / Transaction Layer, If Validated

Goal: add or deeply integrate POS only if strategically justified.

Possible paths include POS Integration Layer, POS Companion, Lightweight POS, or Full RetailOS POS. This phase requires explicit founder approval and dedicated security review before payments or POS are built.

### Phase 6 — Finance & Profitability Intelligence

Goal: translate retail operations into margin, cash, and profitability intelligence.

Adds cost tracking, gross margin analysis, markdown impact, inventory value, dead stock capital tied up, recovered margin, campaign/category/store/brand profitability, purchase cost analysis, cash tied in inventory, finance export, and accountant-facing reports.

This is not full accounting software at first.

### Phase 7 — Wholesale / B2B / Distribution OS

Goal: support brands and retail groups that sell wholesale or distribute to partners.

Adds wholesale customers, B2B price lists, wholesale orders, allocations, partner inventory, consignment tracking, wholesale campaign planning, line sheets, B2B order forms, and showroom support.

### Phase 8 — Advanced Intelligence & Forecasting

Goal: move from descriptive/recovery intelligence into predictive and prescriptive intelligence.

Adds demand forecasting, replenishment forecasting, markdown optimization, sell-through prediction, size curve prediction, transfer/allocation optimization, campaign outcome prediction, buying recommendations, lifecycle forecasting, anomaly detection, and scenario simulation.

Forecasting must be honest: if data is insufficient, RetailOS must say so. Forecasts must show confidence, assumptions, historical basis, data quality, and uncertainty range.

### Phase 9 — Retail Copilot to Retail Agent System

Goal: evolve Retail Copilot from explanation assistant into permissioned workflow agent.

Execution model:

```text
Recommend
→ explain
→ draft
→ request approval
→ execute only after permission
→ audit everything
```

Agent actions require permission checks, approval checks, audit logs, rollback paths where possible, source references, and confidence display.

### Phase 10 — RetailOS Platform Ecosystem

Goal: RetailOS becomes a platform.

Adds public API, webhooks, developer documentation, integration marketplace, partner connectors, app extensions, custom dashboards, custom workflows, consultant workspace, implementation partner tools, external BI export, and enterprise admin controls.

Security and governance become enterprise-grade.

## 7. Phase Gates

A phase is not complete until all gates pass:

1. Product acceptance: scoped workflows, empty/error states, role flows, no fake static final behavior.
2. Security acceptance: auth, tenant isolation, RBAC, RLS, secure APIs, safe uploads, audit logs, service-role boundary, security tests.
3. Quality acceptance: lint, typecheck, unit, integration, e2e where relevant, build, no critical runtime errors.
4. Data acceptance: persisted data, no hardcoded live metrics, validation records, canonical records where approved, scoring from persisted data.
5. Deployment acceptance: GitHub branch/PR, CI, preview, production only after approval, env vars, migration path.
6. Documentation acceptance: README/current state/blockers/docs/acceptance/security decisions updated.

## 8. Security Standard

RetailOS targets Security Grade AAA+:

- secure-by-design;
- tenant isolation by default;
- RBAC enforced in UI, API, and database;
- Supabase RLS on tenant tables;
- no service role in browser code;
- no secrets committed;
- secure upload handling;
- safe error responses;
- audit logs for sensitive actions;
- security tests for critical roles;
- CI gates for security checks.

Reference baselines: OWASP ASVS, OWASP Web Top 10, OWASP API Security Top 10, and NIST Secure Software Development Framework.

If a feature is not secure, it is not complete.

## 9. Harness Engineering Standard

RetailOS must be built with an agent harness, not one-shot prompts.

The repository must support planning, implementation, validation, review, security checks, documentation updates, current state reports, and known failure tracking.

Required folders include `plans/`, `reports/`, `harness/`, `scripts/`, `tests/`, `docs/`, and `.github/workflows/`.

Every major task should produce plan, implementation, validation report, review report, and PR. Do not call work complete just because files changed.

## 10. Source of Truth

The repo is the source of truth. Do not rely on stale chats, screenshots, prompts, or memory.

Important product knowledge must be stored in `docs/`, `reports/`, `plans/`, and `tests/`.

Runtime truth comes from actual code, merged commits, database state, deployment state, and live validation evidence.

## 11. Design Direction

RetailOS should use the approved premium SaaS visual direction:

- dark navy/near-black sidebar;
- purple active navigation;
- white card surfaces;
- clean tables;
- soft borders and subtle shadows;
- premium spacing;
- calm analytical UI;
- role-aware workspaces;
- mobile-first store manager experience;
- Copilot panel integrated into workflows.

The UI should not look like a generic Tailwind starter, ERP clone, Odoo clone, SAP clone, Bootstrap admin, or random AI dashboard.

Design should feel like a sharp retail analyst reviewed the business overnight and prepared the next actions.

## 12. Naming System

Use these names unless updated by product decision:

- RetailOS;
- Fashion Retail Operating Intelligence;
- Consolidation Hub;
- Operating View;
- Inventory Recovery Intelligence;
- Attention Queue;
- Projectisation Engine;
- Retail Copilot;
- Data Confidence Score;
- Inventory Risk Score;
- Recovery Opportunity Score;
- Attention Priority Score;
- Recovery Index;
- Inventory Productivity Score.

Do not casually rename modules.

## 13. Active Phase Control

The active phase and active milestone must be declared in `reports/CURRENT_STATE.md`.

The agent must not build outside the active phase. Future phase work may be documented as TODO, but not implemented unless explicitly approved.

## 14. Completion Rule

Never say “complete” unless code is committed or ready for PR, tests pass, build passes, acceptance criteria pass, security gates pass, deployment state is known, and limitations are clearly listed.

Use honest status language such as:

- Implemented but not verified.
- Verified locally but not deployed.
- Deployed but not connected to database.
- Blocked by missing env vars.
- Blocked by missing GitHub access.
- Ready for review.
- Accepted.

Do not overclaim.

## 15. Hard Prohibitions

Do not:

- expose secrets;
- commit `.env`;
- use service-role key in client code;
- bypass RLS;
- build static dashboards as final working product;
- silently add future-scope features;
- create fake “working” flows backed only by constants;
- deploy without knowing env status;
- call a protected preview publicly accessible;
- ignore failing tests, TypeScript errors, lint errors, or runtime 5xxs;
- remove security checks to pass build;
- force push without approval;
- delete large directories without explicit approval.

## 16. Minimum Validation Commands

Before final response on implementation tasks, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If security scripts exist, also run:

```bash
npm run security
```

If e2e/smoke tests exist and are relevant, run the approved smoke tests or explain why they cannot run.

## 17. Final Response Format

Every final agent response must include:

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

Do not hide blockers. Do not invent links. Do not invent successful tests.
