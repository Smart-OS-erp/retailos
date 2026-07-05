# RetailOS — Agent Operating Manual

## 0. Product Name

The demo/project name is RetailOS.

RetailOS is not necessarily the final commercial product name. Use RetailOS throughout this repository unless a later naming decision changes it.

---

## 1. Mission

RetailOS is the operating system for African fashion retail.

It helps fashion retailers:

- understand inventory
- improve inventory productivity
- recover margin
- reduce dead stock
- optimize merchandising decisions
- coordinate store execution
- connect online/offline retail data
- eventually run inventory, merchandising, store operations, wholesale, finance, and execution workflows from one intelligent system

RetailOS is not a generic ERP.

RetailOS should feel like:

- a retail analyst
- a merchandiser
- an inventory planner
- an operations manager
- a business co-pilot

combined into one operating system.

---

## 2. Core Product Insight

Fashion retailers already manually “projectise” inventory problems.

They bundle slow movers.
They markdown aged stock.
They transfer products between stores.
They reposition products in campaigns.
They create capsule edits.
They ask merchandisers to turn dead stock into commercial action.

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

Every screen must answer:

What requires attention right now?
3. Target Market

Primary geography:

Nigeria
Ghana
Kenya
South Africa
broader African fashion retail markets over time

Target customers:

multi-store fashion retailers
multi-brand retail groups
luxury fashion retailers
omnichannel fashion operators
streetwear brands
boutiques scaling into retail groups
retailers selling through store, web, Instagram, WhatsApp, marketplace, and pop-up channels

Primary users:

ORG_OWNER
EXECUTIVE
MERCHANDISING_MANAGER
STORE_MANAGER
VIEWER

Future users:

INVENTORY_PLANNER
OPERATIONS_MANAGER
FINANCE_MANAGER
WHOLESALE_MANAGER
BUYER
ECOMMERCE_MANAGER
WAREHOUSE_MANAGER
RETAIL_ANALYST
SYSTEM_ADMIN
EXTERNAL_CONSULTANT
4. Product Category

RetailOS belongs to this category:

Fashion Retail Operating Intelligence

Long-term category:

Fashion Retail OS

It should not be positioned as:

generic ERP
generic POS
generic dashboard
generic AI chatbot
generic inventory tracker
accounting software
warehouse-only software
5. Current Build Discipline

The agent may understand the full RetailOS roadmap.

The agent must only build the approved active phase.

Do not build future phases unless explicitly instructed.

Do not expand scope silently.

Do not add POS, finance, wholesale, forecasting, warehouse management, or autonomous campaign execution into an earlier phase unless a human explicitly promotes that feature into the active phase.

Every phase must be:

implemented
tested
secured
documented
deployed
accepted

before the next phase begins.

The active phase must always be declared in:

reports/CURRENT_STATE.md
6. Full RetailOS Roadmap
Phase 0 — Foundation: Inventory Recovery Intelligence

Goal:

Create the secure SaaS foundation and prove the core wedge:

Upload/connect retail data
→ validate it
→ consolidate it
→ detect inventory risk
→ generate recovery opportunities
→ create projectisation plans
→ generate campaign briefs
→ explain through Retail Copilot

Phase 0 must include:

Product Foundation
authentication
signup
login
organization creation
onboarding
company setup
locations setup
brands setup
team invite
role-based landing
sample data flow
empty states
setup checklist
Security Foundation
Supabase Auth
organization membership
RBAC
location scope
tenant isolation
Supabase RLS
secure API patterns
audit logging
no service role in client code
security tests
secrets management
CI security checks
Data Foundation
CSV upload
Excel upload if feasible
sample data
product master upload
inventory snapshot upload
sales history upload
store master upload
upload parsing
column mapping
staging rows
validation issues
blocking issues
warnings
approval before consolidation
Consolidation Hub
entities
brands
locations
products
SKUs
inventory snapshots
inventory positions
current inventory view
data health
Operating View
Intelligence
Data Confidence Score
Inventory Risk Score
Recovery Opportunity Score
Attention Priority Score
Inventory Recovery Intelligence
Attention Queue
Executive Briefing
Opportunity Generation
Projectisation
recovery opportunities
recovery projects
project tasks
project status
project approval
Dead Stock Value Projectised
campaign brief generation
campaign brief approval
Workspaces
Executive Workspace
Merchandising Workspace
Store Manager Workspace
Viewer Workspace
Retail Copilot Workspace
Copilot

Retail Copilot may be deterministic/template-based in Phase 0.

It must:

use live organization data
respect RBAC
cite source records/chips
refuse unauthorized questions
explain risk
explain data confidence
suggest next workflow actions
Phase 0 Non-Goals

Do not build:

full POS
accounting
purchase orders
supplier management
full warehouse management
advanced forecasting
automatic campaign publishing
WhatsApp integration
autonomous markdown execution
real LLM agent execution
marketplace integrations
wholesale management
finance module
Phase 0.5 — Integration Hub MVP

Goal:

Move RetailOS beyond manual upload into connected retail data.

Add:

Integration Hub
data source setup
Shopify connector scaffold or MVP
WooCommerce connector scaffold or MVP
Google Sheets connector scaffold or MVP
RetailOS Import API
scheduled sync architecture
external record storage
sync jobs
sync errors
webhook event table

Onboarding should ask:

How do you currently manage inventory and sales?

Options:

CSV / Excel
Shopify
WooCommerce
Google Sheets
POS / ERP
custom website
not sure
request onboarding help

Important rule:

RetailOS does not connect to “a website” directly as the primary source.

RetailOS connects to the system behind the website:

Shopify
WooCommerce
Magento / Adobe Commerce
BigCommerce
custom backend
POS
ERP
spreadsheet feed
import API

Phase 0.5 acceptance:

user can create a data source
user can see connection status
user can trigger sync
sync creates raw external records
records normalize into canonical tables
validation/consolidation/intelligence pipeline runs after sync
Phase 1 — Core Inventory Operating System

Goal:

Turn RetailOS from recovery intelligence into the core inventory operating layer.

Add:

inventory ledger
stock movement history
stock adjustments
transfers
transfer recommendations
transfer approvals
store stock counts
warehouse/store reconciliation
inventory audit trail
inventory search
barcode/SKU lookup
stock variance tracking
inventory health by store
replenishment watchlist
low stock alerts
overstock alerts

Key objects:

inventory_movements
stock_adjustments
transfer_requests
transfer_items
stock_counts
stock_count_items
reconciliation_issues
inventory_audit_events

Phase 1 should still not become full ERP.

The focus is operational inventory control and visibility.

Phase 2 — Merchandising & Planning OS

Goal:

Help merchandising teams plan, buy, allocate, markdown, and improve inventory productivity.

Add:

assortment planning
collection planning
buying plan support
allocation planning
replenishment recommendations
size/color curve analysis
category performance
brand performance
collection performance
markdown planning
lifecycle tracking
new arrival monitoring
repeat/reorder signals
product productivity metrics
open-to-buy advisory, if validated

Key modules:

Merchandising Planner
Assortment Workspace
Allocation Workspace
Markdown Planner
Collection Performance
Product Lifecycle Intelligence

Important:

Forecasting may begin here, but should be clearly labeled as directional unless validated with enough sales history.

Phase 3 — Store Operations OS

Goal:

Coordinate store-level execution.

Add:

store task management
daily store briefing
store manager action cards
stock count workflows
transfer receiving
merchandising instructions
campaign execution checklist
visual merchandising tasks
stock issue reporting
store performance review
store compliance tracking
mobile-first store workspace

Potential future capabilities:

offline-friendly PWA behavior
barcode scanning
photo proof of execution
store team comments
escalation rules

Important:

This is not full workforce management.

It is retail execution around inventory, merchandising, and recovery actions.

Phase 4 — Omnichannel Sales & Customer Operations

Goal:

Unify retail activity across store, ecommerce, Instagram, WhatsApp, and other sales channels.

Add:

order ingestion
online/offline sales reconciliation
channel performance
customer/order signals
returns/refunds
discount usage
campaign performance
customer segment signals
omnichannel inventory exposure
online sell-through vs store sell-through
Instagram/WhatsApp manual order import
ecommerce connector expansion

Possible modules:

Channel Performance
Campaign Performance
Order Intelligence
Customer Demand Signals

Important:

Do not build a full CRM too early.

Customer intelligence should support merchandising and inventory decisions first.

Phase 5 — POS / Transaction Layer, if validated

Goal:

Only if strategically justified, RetailOS may add or deeply integrate POS functionality.

Possible paths:

POS Integration Layer
POS Companion
Lightweight POS
Full RetailOS POS

Do not assume full POS is required.

This phase requires explicit founder approval.

If built, it may include:

sales transaction capture
returns
exchanges
discounts
receipts
cashier sessions
payment provider integrations
offline mode
customer capture
store till reporting

Security requirements increase significantly in this phase.

Never build payments or POS without dedicated security review.

Phase 6 — Finance & Profitability Intelligence

Goal:

Translate retail operations into margin, cash, and profitability intelligence.

Add:

cost tracking
gross margin analysis
markdown impact
inventory value
dead stock capital tied up
recovered margin
campaign profitability
category profitability
store profitability
brand profitability
purchase cost analysis
cash tied in inventory
finance export
accountant-facing reports

Possible integrations:

accounting systems
ERP
bank/payment exports
POS settlements

Important:

This is not full accounting software at first.

The wedge is inventory-led profitability intelligence.

Phase 7 — Wholesale / B2B / Distribution OS

Goal:

Support brands and retail groups that sell wholesale or distribute to partners.

Add:

wholesale customers
B2B price lists
wholesale orders
allocations to wholesale accounts
partner inventory
consignment tracking
wholesale campaign planning
collection line sheets
B2B order forms
showroom support

This phase is only built after core retail inventory and merchandising workflows are strong.

Phase 8 — Advanced Intelligence & Forecasting

Goal:

Move from descriptive/recovery intelligence into predictive and prescriptive intelligence.

Add:

demand forecasting
replenishment forecasting
markdown optimization
sell-through prediction
size curve prediction
transfer optimization
allocation optimization
campaign outcome prediction
buying recommendations
product lifecycle forecasting
anomaly detection
scenario simulation

Important:

Forecasting must be honest.

If data is insufficient, RetailOS must say so.

No fake precision.

Forecasts must show:

confidence
assumptions
historical basis
data quality
uncertainty range
Phase 9 — Retail Copilot to Retail Agent System

Goal:

Evolve Retail Copilot from explanation assistant into permissioned workflow agent.

Retail Copilot can eventually:

generate project plans
draft campaigns
assign tasks
prepare approval packs
summarize performance
monitor risks
recommend transfers
prepare buying notes
prepare markdown plans
answer executive questions
coordinate workflows

But it must not silently execute sensitive actions.

Execution model:

Recommend
→ explain
→ draft
→ request approval
→ execute only after permission
→ audit everything

Agent actions require:

permission check
approval check
audit log
rollback path where possible
source references
confidence display
Phase 10 — RetailOS Platform Ecosystem

Goal:

RetailOS becomes a platform.

Add:

public API
webhooks
developer documentation
integration marketplace
partner connectors
app extensions
custom dashboards
custom workflows
consultant workspace
implementation partner tools
external BI export
enterprise admin controls

Security and governance become enterprise-grade.

7. Phase Gates

A phase is not complete until all gates pass.

Gate 1 — Product Acceptance
scope implemented
core user workflows work
empty states work
error states work
role-specific flows work
no static demo-only behavior remains unless explicitly allowed
Gate 2 — Security Acceptance
auth works
tenant isolation works
RBAC works
RLS works
service role is not in client code
API routes enforce permissions
uploads are safely handled
security tests pass
audit logs exist for sensitive actions
Gate 3 — Quality Acceptance
lint passes
typecheck passes
unit tests pass
integration tests pass
e2e tests pass for critical workflows
build passes
no known critical runtime errors
Gate 4 — Data Acceptance
data persists correctly
no hardcoded dashboard data where live data is required
sample data is inserted into current organization
uploads produce validation records
consolidation creates canonical records
scoring uses persisted data
Gate 5 — Deployment Acceptance
GitHub branch exists
PR exists
CI passes
Vercel preview deploys
production deploys only after approval
required env vars are configured
migration path documented
Gate 6 — Documentation Acceptance
README updated
current state report updated
known blockers updated
relevant docs updated
acceptance tests documented
security decisions documented
8. Security Standard

RetailOS must target:

RetailOS Security Grade AAA+

Meaning:

secure-by-design
tenant isolation by default
RBAC enforced in UI, API, and database
Supabase RLS on tenant tables
no service role in browser code
no secrets committed
secure upload handling
safe error responses
audit logs for sensitive actions
security tests for critical roles
CI gates for security checks

Use these reference baselines:

OWASP ASVS
OWASP Web Top 10
OWASP API Security Top 10
NIST Secure Software Development Framework

Security rule:

If a feature is not secure, it is not complete.
9. Harness Engineering Standard

RetailOS must be built with an agent harness, not one-shot prompts.

The repository must support:

planning
implementation
validation
review
security checks
documentation updates
current state reports
known failure tracking

Required folders:

plans/
reports/
harness/
scripts/
tests/
docs/
.github/workflows/

Every major task should produce:

Plan
→ implementation
→ validation report
→ review report
→ PR

Do not call work complete just because files changed.

10. Agent Workflow

Before starting any task:

Read this file.
Read reports/CURRENT_STATE.md.
Read reports/NEXT_TASK.md.
Read the relevant docs for the task.
Confirm the active phase.
Identify acceptance criteria.
Make a plan.
Implement only the approved scope.
Run validation.
Write/update report.
Commit or prepare PR.
11. Source of Truth

The repo is the source of truth.

Do not rely on:

old ChatGPT conversations
old specialist chats
stale prompts
memory from previous sessions
external assumptions
static screenshots alone

Important product knowledge must be stored in:

docs/
reports/
plans/
tests/
12. Design Direction

RetailOS should use the approved premium SaaS visual direction:

dark navy/near-black sidebar
purple active navigation
white card surfaces
clean table styling
soft borders
subtle shadows
premium spacing
calm analytical UI
role-aware workspaces
mobile-first store manager experience
Copilot panel integrated into workflows

The UI should not look like:

generic Tailwind starter
ERP clone
Odoo clone
SAP clone
Bootstrap admin
random AI dashboard

Design should feel like:

A sharp retail analyst reviewed the business overnight and prepared the next actions.
13. Naming System

Use these names unless updated by product decision:

RetailOS
Fashion Retail Operating Intelligence
Consolidation Hub
Operating View
Inventory Recovery Intelligence
Attention Queue
Projectisation Engine
Retail Copilot
Data Confidence Score
Inventory Risk Score
Recovery Opportunity Score
Attention Priority Score
Recovery Index
Inventory Productivity Score

Do not casually rename modules.
14. Active Phase Control

The active phase must be declared in:

reports/CURRENT_STATE.md

Example:

Active Phase: Phase 0 — Foundation: Inventory Recovery Intelligence

The agent must not build outside the active phase.

Future phase work may be documented as TODO, but not implemented unless explicitly approved.
15. Completion Rule

Never say “complete” unless:

code is committed or ready for PR
tests pass
build passes
acceptance criteria pass
security gates pass
deployment state is known
limitations are clearly listed

Use honest status language:

Implemented but not verified.
Verified locally but not deployed.
Deployed but not connected to database.
Blocked by missing env vars.
Blocked by missing GitHub access.
Ready for review.
Accepted.

Do not overclaim.
16. Hard Prohibitions

Do not:

expose secrets
commit .env
use service role key in client code
bypass RLS
build static dashboards as final working product
silently add future-scope features
create fake “working” flows backed only by constants
deploy without knowing env status
call a protected preview publicly accessible
ignore failing tests
ignore TypeScript errors
ignore lint errors
remove security checks to pass build
force push without approval
delete large directories without explicit approval
17. Minimum Validation Commands

Before final response on any implementation task, run:

npm run lint
npm run typecheck
npm run test
npm run build

If security scripts exist, also run:

npm run security

If e2e tests exist, run the relevant smoke tests:

npm run smoke:onboarding
npm run smoke:upload

If a command cannot run, explain why.

18. Final Response Format

Every final agent response must include:

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

Do not hide blockers.
Do not invent links.
Do not invent successful tests.
