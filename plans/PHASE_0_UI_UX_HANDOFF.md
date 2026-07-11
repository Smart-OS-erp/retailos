# Phase 0 UI/UX Handoff

**Status:** Design specification only; no product UI, routes, components, or mock screens are authorized by this document.

**Active phase:** Phase 0 — Foundation: Inventory Recovery Intelligence

**Current repository mode:** Phase 0 end-to-end — design and architecture

**Implementation gate:** Start implementation only after this handoff, the engineering plan, and the security gate are accepted. Each milestone still passes its own data, authorization, and validation gate.

## 1. Purpose and guardrails

This handoff defines the production UX contract for Phase 0 so later implementation can be secure, coherent, accessible, and evidence-based. It covers information architecture, permission-aware navigation, milestone flows, screen responsibilities, responsive behavior, state handling, component contracts, and data provenance.

It does not authorize:

- an application scaffold or product code;
- Figma screens, screenshots, polished mockups, or a component library;
- fabricated analytics, static dashboards, fake success states, or demo-only production behavior;
- integrations, POS, finance, wholesale, forecasting, transfers, autonomous Copilot actions, or any other future-phase capability;
- implementation of all Phase 0 surfaces in one change.

Each later UI slice must be paired with its real tenant-scoped data path, server authorization, RLS policy, negative security tests, non-happy states, and acceptance evidence. If those do not exist, the surface remains a specification.

## 2. Experience outcome

RetailOS should help an authorized user answer:

1. What requires attention now?
2. Can I trust the underlying data?
3. Why was this item classified this way?
4. What action is being proposed?
5. Am I permitted to review, approve, or execute it?
6. What happened after the decision?

The interaction model is:

```text
Establish tenant context
→ verify data readiness
→ ingest and validate records
→ approve consolidation
→ review prioritized inventory risk
→ inspect evidence and confidence
→ prepare a recovery project
→ request or record approval
→ track execution without autonomous side effects
```

## 3. Experience principles

- **Trust before polish:** freshness, provenance, coverage, confidence, and limitations are visible where decisions are made.
- **Attention before overview:** the primary landing experience prioritizes exceptions and next actions, not decorative KPI grids.
- **Permission before affordance:** actions derive from server-resolved permissions. Hidden navigation is convenience, never enforcement.
- **Explain before recommend:** recovery suggestions expose contributing signals, excluded evidence, rule version, and uncertainty.
- **Proposal before execution:** drafting, approval, execution, and rollback are distinct states and controls.
- **Unknown is a valid result:** missing or conflicting evidence appears as unknown or reduced confidence, never as zero or a fabricated value.
- **Mobile work is first-class:** critical review, approval, retry, and task flows work on narrow screens and tolerate interruption.
- **Local context is explicit:** organization timezone, currency, locale, date format, and location context accompany relevant values.
- **Calm analytical presentation:** dense operational information uses clear hierarchy, restrained emphasis, soft boundaries, and accessible status treatment.

## 4. Phase 0 delivery milestones

The screen inventory below is a roadmap within the active phase, not authority to build every screen at once.

### Milestone A — Secure foundation

The current secure foundation is the baseline. Its expansion requires the combined handoff to be accepted:

- authentication and session recovery;
- organization creation or invitation acceptance;
- membership and effective permission resolution;
- organization basics and location basics;
- minimal setup status and authorized landing;
- negative tenant-isolation and role tests.

### Milestone B — Trusted data intake

Requires a separate approved vertical slice:

- inventory/product/sales/store file intake;
- column mapping and staging;
- blocking issue and warning review;
- explicit consolidation approval;
- data health and provenance.

### Milestone C — Inventory recovery intelligence

Requires persisted, versioned scoring rules and approved business decisions:

- attention queue;
- recovery opportunity detail;
- executive briefing/operating view based on live organization data;
- explainable risk, confidence, and priority.

### Milestone D — Projectisation and approval

Requires explicit action permissions and audit events:

- recovery project draft;
- tasks and ownership;
- campaign brief draft;
- approval and rejection states;
- progress tracking without automatic price, stock, publishing, or customer-contact actions.

### Milestone E — Retail Copilot explanation

May be deterministic/template-based in Phase 0. It must use permitted live organization data, cite source records, disclose uncertainty, refuse unauthorized questions, and suggest only allowed next workflow steps.

## 5. Information architecture

### 5.1 Authenticated structure

```text
RetailOS
├── Operating View
│   ├── Setup and data-readiness status
│   ├── Attention summary
│   └── Executive briefing
├── Data
│   ├── Uploads
│   ├── Mapping and validation
│   ├── Consolidation Hub
│   └── Data Health
├── Inventory Recovery
│   ├── Attention Queue
│   └── Recovery Opportunities
├── Projects
│   ├── Recovery Projects
│   └── Campaign Briefs
├── Retail Copilot
└── Organization
    ├── Company and operating context
    ├── Locations and brands
    ├── Team and access
    └── Account/session controls
```

Only approved milestone areas appear in an implementation. Future entries must not be inert navigation, teaser routes, or static placeholders.

### 5.2 Shell rules

- Always expose the active organization and offer switching only among valid active memberships.
- On organization switch, invalidate organization-scoped client state and reauthorize on the server before rendering tenant data.
- Never encode tenant identity only in client state or trust an organization ID from the URL.
- Keep a persistent route/page title and task context; breadcrumbs are used where hierarchy is more than one level deep.
- The first focusable element is a skip link, followed by page heading and primary task content.
- Show session or connectivity state without exposing credentials, internal policy details, or other tenant existence.
- Do not display unauthorized navigation counts, entity names, previews, or cached content.

### 5.3 Approved Phase 0 route contract

Routes are delivered progressively by milestone and must not exist as inert placeholders. The approved multi-step onboarding URLs share one server-authoritative resumable state machine; the URL never establishes completion or permission by itself.

| Milestone | Route | Responsibility |
| --- | --- | --- |
| A | `/signup`, `/login`, `/logout` | Establish or end identity through approved authentication methods |
| A | `/auth/confirm` | Token-hash verification outcome; invalid, expired, and replayed links fail safely |
| A | `/create-organization` | Create the first organization through the atomic server/database workflow |
| A | `/onboarding/company`, `/onboarding/locations`, `/onboarding/brands`, `/onboarding/team`, `/onboarding/data-source`, `/onboarding/complete` | Resumable, server-authoritative setup steps |
| B | `/data`, `/data/uploads`, `/data/uploads/new`, `/data/uploads/[uploadId]`, `/data/validation`, `/data/health` | Sample-data entry, hostile upload lifecycle, validation, lineage, and readiness |
| C | `/consolidation`, `/consolidation/operating-view`, `/consolidation/entities`, `/consolidation/stores/[storeId]`, `/consolidation/brands/[brandId]` | Approval, canonical matching, current positions, and evidence-backed operating view |
| D | `/inventory-recovery`, `/inventory-recovery/skus`, `/inventory-recovery/aging`, `/inventory-recovery/categories`, `/inventory-recovery/stores`, `/attention-queue` | Explainable scores, inventory risk, recovery opportunities, and priority |
| E | `/projectisation`, `/projectisation/opportunities`, `/projectisation/opportunities/[opportunityId]`, `/projectisation/projects`, `/projectisation/projects/new`, `/projectisation/projects/[projectId]`, `/projectisation/campaign-briefs`, `/projectisation/campaign-briefs/[campaignBriefId]` | Opportunity conversion, recovery projects, evidence retention, briefs, and approvals |
| E | `/tasks`, `/tasks/approvals`, `/tasks/completed` | Permission- and assignment-scoped task work |
| F | `/copilot`, `/copilot/morning-brief`, `/copilot/risks`, `/copilot/opportunities`, `/copilot/actions`, `/copilot/saved-insights`, `/copilot/activity-log` | Deterministic, permission-aware explanation and workflow guidance |
| G | `/workspace`, `/workspace/executive`, `/workspace/merchandising`, `/workspace/store`, `/workspace/viewer` | Role-aware landing and live-data workspaces |

Dynamic route identifiers are untrusted input. A route must not render cached or server data until membership, active organization, record ownership, and permission checks succeed. Whether organization context is also encoded in the URL is an engineering/security decision; the UX invariants are that active context is always visible, organization switching reauthorizes server-side, and an ID or slug never establishes scope by itself.

## 6. Role-aware navigation

Canonical role labels follow `docs/RBAC.md`. Exact permission identifiers remain a pre-implementation requirement and are the source of truth for behavior.

| Role | Default landing | Visible work areas | Mutating affordances |
| --- | --- | --- | --- |
| ORG_OWNER | Executive Workspace or setup status | All approved Phase 0 areas; organization and access administration | Explicit owner permissions only; owner transfer and last-owner changes require recent authentication, confirmation, and audit |
| EXECUTIVE | Executive Workspace | Organization-wide operating view, attention, projects, briefings, and delegated approvals | Approval only when separately delegated; no inferred organization-management rights |
| MERCHANDISING_MANAGER | Merchandising Workspace | Data intake, validation, consolidation, recovery intelligence, and permitted projects | Upload, remediation, drafting, and approval only where named permissions and workflow state allow |
| STORE_MANAGER | Store Workspace | Assigned-location attention, tasks, project instructions, and permitted inventory context | Assigned-location and assigned-task mutations only; no tenant-wide data or approval rights |
| VIEWER | Viewer Workspace | Explicitly granted read-only summaries and details | None; mutation routes and controls are absent and direct requests are denied |

Navigation rules:

- A user with no valid membership does not enter the authenticated tenant shell.
- A suspended, expired, or removed membership fails closed and clears tenant-scoped UI state.
- Route guards and UI visibility use server-resolved effective permissions; API and RLS enforcement remain authoritative.
- When a user can view a record but cannot act, show the record and its current workflow status without revealing who has permissions unless that identity is itself authorized.
- Use a permission-denied page only after a safe authorization check. Do not reveal whether a forbidden tenant resource exists.

## 7. Milestone flows

### 7.1 Authentication and tenant establishment

1. User signs up, signs in, or follows an approved invitation link.
2. The system establishes a secure server-backed session.
3. The user creates an organization or accepts a valid, unexpired, single-use invitation.
4. The server resolves membership and effective permissions.
5. The user supplies organization identity, primary currency, timezone, and basic operating location context.
6. The user reviews data-use and inventory-source readiness requirements.
7. The system rechecks authorization and routes the user to setup status or the first permitted workspace.

Interruption and retry requirements:

- Persist only server-accepted progress, never optimistic membership or role claims.
- Repeated organization creation/invitation requests are idempotent.
- Expired or consumed invitations have a safe recovery path without exposing organization membership details.
- Session expiry preserves non-sensitive form input only when safe, then requires reauthentication before submission.

### 7.2 Data intake to consolidation

1. User chooses an approved file type and sees size/type/content constraints before selection.
2. Upload enters a tenant-scoped staged/quarantine state; success means received, not trusted or consolidated.
3. Parser reports sheet/file structure and asks the user to map required fields.
4. Validation separates blocking issues, warnings, and informational notices with row/column references.
5. User corrects the source or approved mappings and revalidates.
6. Authorized user reviews a consolidation summary: affected entities, inserts/updates, exclusions, provenance, and warnings.
7. Explicit approval creates canonical records and an audit event.
8. Data Health shows what was accepted, rejected, stale, partial, or unresolved.

The UI never treats upload completion, parsing, validation, or consolidation as the same event.

### 7.3 Attention to recovery opportunity

1. User enters the Attention Queue scoped to the active organization and permitted locations.
2. Queue items expose priority, inventory value context, confidence, freshness, and the primary reason for attention.
3. User opens an opportunity and reviews contributing signals, input coverage, rule version, source records, caveats, and unavailable evidence.
4. If confidence is below the approved threshold, the workflow redirects toward data remediation or suppresses the recovery recommendation.
5. If sufficient evidence exists, an authorized user may draft a recovery project; no stock, price, campaign, or customer-facing mutation occurs.

### 7.4 Recovery project and campaign brief

1. User selects eligible opportunity records and creates a draft.
2. The system carries evidence references and calculation versions into the draft.
3. User adds objective, owners, locations, due dates, proposed tasks, and success measures.
4. Campaign brief content is generated or assembled as a draft with its source context and limitations.
5. Authorized approver accepts, rejects, or requests changes.
6. Status changes and sensitive decisions create audit events.
7. Execution remains human-led in Phase 0; external publishing and autonomous operational changes are prohibited.

### 7.5 Retail Copilot explanation

1. User asks a question within the active organization and visible workspace context.
2. Server resolves effective permissions before retrieval or tool use.
3. Copilot answers from approved structured results and permitted records.
4. Response includes source chips, data freshness, confidence/limitations, and a permitted next action.
5. Unauthorized, cross-tenant, unsupported, or high-impact requests are refused safely.

Copilot must not expose hidden records in citations, autocomplete, conversation history, error text, or suggested prompts.

## 8. Screen responsibility catalogue

These are implementation contracts for later approved slices, not generated screens.

| Surface | Primary outcome | Critical information | Required states |
| --- | --- | --- | --- |
| Sign up / sign in | Establish identity securely | Approved auth method, verification status, recovery path | loading, invalid credentials, verification required, rate limited, session expired |
| Invitation acceptance | Join the intended organization safely | Invitation validity, recipient context where safe, terms, resulting access | loading, expired, consumed, wrong recipient, already a member, unauthorized |
| Organization setup | Establish tenant operating context | organization identity, currency, timezone, first location | draft, validation error, duplicate retry, save failure, permission lost |
| Setup status | Show the next safe prerequisite | membership, organization basics, location/data readiness | first-use empty, partially complete, blocked, complete |
| Operating View | Present current attention and trust state | freshness, data health, prioritized items, approved briefing | no data, partial, stale, low confidence, error, forbidden |
| Uploads | Start and monitor tenant-scoped intake | source type, file constraints, upload/parser state, uploader, timestamp | empty, uploading, interrupted, quarantined, rejected, parsing, failed |
| Column mapping | Map source fields without corrupting meaning | required/optional fields, detected headers, types, examples with sensitive data minimized | incomplete, ambiguous, invalid type, reusable mapping unavailable |
| Validation issues | Make problems actionable | severity, row/column, rule, safe sample, remediation, counts | no issues, warnings only, blockers, truncated preview, parser failure |
| Consolidation review | Approve canonical record changes | inserts/updates/exclusions, affected entities, provenance, warnings | not authorized, changed since validation, approval pending, failed, complete |
| Data Health | Explain readiness and limitations | source coverage, freshness, conflicts, unknowns, last successful consolidation | no sources, partial, stale, degraded, recovering, healthy |
| Attention Queue | Prioritize reviewable inventory risk | priority, reason, value/currency, location, confidence, freshness | empty-success, not ready, low confidence suppressed, partial, stale, error |
| Recovery opportunity detail | Explain why and what next | contributing signals, source records, calculations, caveats, rule version, permitted actions | unavailable evidence, conflicting data, suppressed, stale, forbidden |
| Recovery project draft/detail | Turn an approved opportunity into controlled work | objective, linked evidence, owners, tasks, dates, status, approvals | draft, validation error, approval required, rejected, active, blocked, complete |
| Campaign brief review | Review an evidence-backed draft | audience/context, products, rationale, constraints, approval record | draft, unsupported content flagged, changes requested, approved, rejected |
| Retail Copilot | Explain permitted data and workflow | question context, response, source chips, freshness, confidence, suggested next step | thinking, partial answer, insufficient data, refused, tool error, stale source |
| Organization / team | Manage permitted tenant context | profile, locations, brands, memberships, roles | empty, invite pending, role conflict, last-owner safeguard, forbidden |

## 9. Responsive and mobile behavior

### 9.1 Breakpoint-independent rules

- Design from content priority and available width; tokenized breakpoints are implementation details requiring design review.
- Primary task, tenant context, data status, and blocking warnings remain visible at every size.
- Never hide required evidence or permission context only because the viewport is narrow.
- Touch targets meet at least 44 by 44 CSS pixels; controls have spacing that prevents accidental high-impact actions.
- Long-running tasks survive navigation and reconnect by reading server state, not relying on a foreground browser tab.

### 9.2 Narrow/mobile

- Replace the persistent sidebar with an accessible navigation trigger and full-screen or modal navigation that traps focus correctly and restores it on close.
- Present dense tables as task-oriented cards or a horizontal detail pattern only when column relationships remain understandable. Keep row identity and critical status fixed in view.
- Filters open in a labelled sheet/dialog, announce the applied count, and provide a one-action reset.
- Place the principal action in normal document flow; sticky actions may supplement it but cannot obscure content or the on-screen keyboard.
- Opportunity detail orders content as: decision status, why it matters, confidence/freshness, evidence, proposed next step, history.
- Multi-step setup and upload flows show current step, completed server-confirmed steps, and safe resume behavior.
- Offline mode is read-only unless a later approved design specifies conflict-safe queued mutations. Cached tenant content must be protected and visibly timestamped.

### 9.3 Tablet and desktop

- Use a stable navigation rail/sidebar only when it does not crowd task content.
- Allow evidence and action context to appear side by side, but preserve a logical single-column reading and focus order.
- Tables may expose more columns with user-controlled density; critical labels and units never rely on tooltips alone.
- Copilot may occupy a contextual panel, but it cannot obscure the underlying source context or act as a separate authorization boundary.

## 10. State model

Every implemented screen must define these states before acceptance.

### Loading

- Use structural placeholders only when the final structure is known; otherwise use a labelled progress state.
- Preserve page heading and tenant context.
- Do not show cached values as current without a stale label and timestamp.
- Announce meaningful state transitions to assistive technology without excessive repetition.

### Empty

Differentiate:

- **First use:** no approved data/source exists; show the permitted setup action.
- **No results:** data exists but filters return none; show active filters and reset.
- **Resolved:** there are genuinely no items requiring attention; show analysis window and freshness.
- **Not permitted:** never disguise denial as an empty dataset.

### Error

- Use safe, user-actionable language and a correlation/reference ID where supported.
- Do not reveal SQL, internal policy names, secrets, stack traces, object IDs, or whether another tenant's resource exists.
- Distinguish retryable connection errors from validation failures and permission failures.
- Preserve server-accepted progress and clearly state what did not complete.

### Partial or stale data

- Show which sources, locations, periods, or fields are missing.
- Display last successful update and the timezone used.
- Keep partial totals visually and semantically distinct from complete totals.
- Do not rank incomplete values beside complete values without an explicit caveat.

### Low confidence or unknown

- Display `Unknown` or `Insufficient evidence`, not `0`, where the metric cannot be established.
- Explain the missing/conflicting inputs and the remediation route.
- Below the approved threshold, suppress the recommendation or convert it to a data-quality task.
- Never use confidence color alone; pair text, iconography, and accessible descriptions.

### Permission denied

- Fail closed and clear tenant-scoped cached content.
- Explain the user's next safe step without advertising privileged data or actions.
- Distinguish reauthentication, missing membership, insufficient permission, and removed access only when it is safe to do so.
- Do not provide a client-only override or invite the user to modify organization/role values.

### Offline or interrupted

- Display connection state and last confirmed server state.
- Do not claim completion for queued, timed-out, or unconfirmed mutations.
- Provide retry/resume where idempotency exists; otherwise require a safe status refresh before resubmission.

## 11. Accessibility acceptance contract

Target WCAG 2.2 AA at minimum.

- One descriptive `h1` per screen; headings follow a logical hierarchy.
- All functions operate by keyboard with visible focus and no traps outside intentional modal patterns.
- Focus moves to the first invalid field, new error summary, or changed workflow heading as appropriate, and is restored after dismissed overlays.
- Status updates use appropriate live regions; long-running upload and validation progress are announced at useful intervals.
- Inputs have persistent labels, instructions, examples, error association, and programmatic required state.
- Tables use captions, header relationships, and accessible names; responsive alternatives preserve the same meaning.
- Charts, if later approved, have text/table equivalents and do not carry decision-critical information only visually.
- Status, severity, confidence, and role state never rely on color alone.
- Text and meaningful UI components meet contrast requirements in every state, including disabled, focus, hover, and high-contrast modes.
- Motion respects reduced-motion preferences and is never required to understand a result.
- Currency, quantities, dates, and percentages have unambiguous accessible labels and locale-aware formatting.
- Error copy tells the user what happened, what remains safe, and what they can do next.

## 12. Component inventory

Components are future implementation contracts. They must be backed by semantic tokens and documented states before code or Figma library work.

### Navigation and context

- authenticated app shell;
- skip link and page heading block;
- permission-filtered primary navigation;
- organization switcher;
- location/context selector where approved;
- user/session menu;
- responsive breadcrumb and back pattern;
- connectivity/session status.

### Trust and provenance

- data-status banner;
- freshness timestamp;
- coverage indicator;
- confidence indicator with text explanation;
- source chip/link;
- calculation definition popover or disclosure;
- rule/model version label;
- caveat and partial-data notice;
- audit/status history.

### Data intake

- secure file picker/drop target;
- upload progress and quarantine status;
- source schema summary;
- column-mapping row;
- validation issue summary;
- issue table/card;
- consolidation impact summary;
- approval confirmation.

### Intelligence and work management

- attention item;
- metric with unit, window, confidence, and unavailable state;
- recovery reason/evidence list;
- priority/status badge with non-color label;
- filter/sort controls;
- project status and task list;
- approval record and decision control;
- campaign brief section with unsupported-content flags.

### Feedback and safety

- empty state;
- loading/progress state;
- inline validation and error summary;
- partial/stale data warning;
- permission boundary/refusal state;
- destructive/high-impact confirmation;
- retry/resume control;
- toast only for supplementary confirmation, never as the sole record of a critical result.

### Copilot

- permission-scoped prompt input;
- response block with explicit evidence citations;
- source chip collection;
- confidence/limitations disclosure;
- suggested workflow action with permission state;
- refusal and insufficient-evidence response;
- tool/action history where approved and auditable.

## 13. Data provenance contract

Every decision-support result must make the following retrievable and human-readable:

- active organization and permitted location scope;
- source type and source record reference without exposing unsafe raw data;
- upload or sync identifier where applicable;
- source observation/import time and last successful consolidation time;
- timezone and currency context;
- data coverage and known exclusions;
- calculation name and version;
- analysis window and input timestamps;
- confidence state and its basis;
- contributing and conflicting signals;
- actor and timestamp for approval/status changes;
- a safe route to the permitted source detail.

Display rules:

- A metric never appears without its unit/currency and relevant time window.
- A cross-location or cross-period aggregation states its scope.
- Converted currency values require the rate source and timestamp; otherwise values remain in their original currencies and are not totaled.
- Source chips are authorization-aware links, not plain IDs or leaked record titles.
- A refreshed calculation never silently rewrites the evidence behind an approved project; retain the version used at decision time and show that newer evidence exists.
- Exports, screenshots, logs, analytics events, and Copilot prompts must not become alternative paths around tenant scope or field permissions.

### 13.1 Entity naming alignment

UI language should describe user concepts rather than leak physical table names. Engineering plans and future schemas should preserve the current repository vocabulary unless an architecture decision explicitly renames it:

- use `organizations` for tenants;
- use `memberships` for the organization/user/role relationship, not a duplicate `organization_memberships` alias;
- use `audit_events` for immutable security and sensitive workflow evidence, not interchangeable `audit_logs` and `event_log` tables;
- reserve a separate domain event stream only if a future architecture decision documents a different retention, ordering, consumer, and security purpose;
- use `uploads`, `validation_issues`, and `consolidations` as UX concepts while exact staging/storage table names remain an engineering decision;
- use `recovery_opportunities`, `recovery_projects`, `project_tasks`, and `campaign_briefs` only when their respective Phase 0 milestone is approved.

Preferred user-facing labels are **Organization**, **Team & access**, **Activity history**, **Uploads**, **Validation issues**, **Consolidation Hub**, **Recovery opportunity**, **Recovery project**, and **Campaign brief**. Do not expose database vocabulary in navigation, errors, or help text.

## 14. Product-owner decisions required before intelligence UI

No screen design, fixture, acceptance expectation, score band, chart, queue ordering, or explanatory copy may bake in numeric defaults for these unresolved rules:

1. **Inventory age bands:** approved thresholds, evidence hierarchy for start date, and treatment of unknown receipt/availability dates.
2. **Sales analysis window:** eligible periods, comparison windows, seasonality treatment, and exclusions such as voids or returns.
3. **Inventory cost basis:** approved source of cost, handling of missing cost, tax/landed-cost treatment, and valuation currency.
4. **Confidence formula:** required inputs, weighting, suppression threshold, display language, and treatment of conflicting evidence.
5. **Currency behavior:** organization base currency, multi-currency aggregation rules, exchange-rate source, rate timestamp, and rounding.
6. **Recovery-action catalogue:** allowed Phase 0 recommendations, permission/approval requirements, required evidence, and explicit distinction between a proposal and an executable action.

Until approved, prototypes and tests may use labels such as `Threshold pending approval` or `Insufficient evidence`; they must not imply a product rule.

## 15. Visual-system readiness

The intended tone is premium, calm, and analytical: dark navigation, purple active emphasis, white information surfaces, clean data presentation, soft boundaries, restrained shadow, and generous operational spacing. It must not resemble a generic admin starter or ERP clone.

The current `figma-handoff/design-tokens.json` is documentation-only and already establishes the approved dark inverse surface and purple primary action direction. Before any Figma library or UI implementation:

- semantic color roles and interaction states must be defined without embedding business meaning in raw palette names;
- all text, focus, status, disabled, and interactive combinations must pass contrast review;
- status/confidence semantics must work without color;
- spacing, typography, elevation, and responsive tokens must be completed;
- the token file and design documentation must be reconciled in one reviewed change.

No implementation should treat the current starter values as final merely because they are machine-readable.

## 16. Analytics and audit boundaries

- Product analytics may record screen/workflow events, outcome categories, timing, and safe identifiers only after privacy review.
- Do not include raw inventory rows, uploaded filenames containing sensitive data, prompts, free text, tokens, emails, or cross-tenant identifiers in analytics payloads.
- Sensitive actions such as organization creation, invitation acceptance, membership/role changes, consolidation approval, project approval, and Copilot tool use require server-side audit events.
- Analytics are not an authorization or audit substitute.

## 17. Design acceptance checklist for each approved slice

Before implementation begins:

- [ ] Slice is explicitly approved within active Phase 0.
- [ ] Role labels and exact permission IDs are resolved.
- [ ] Tenant, location, and record ownership boundaries are documented.
- [ ] Real data contract and provenance fields are defined.
- [ ] Loading, first-use empty, filtered empty, partial, stale, error, offline, low-confidence, session-expired, and permission-denied states are specified.
- [ ] Mobile, tablet, desktop, keyboard, screen-reader, focus, contrast, and reduced-motion behavior are reviewed.
- [ ] Proposal, approval, execution, and rollback states are unambiguous.
- [ ] Audit and privacy-safe analytics events are identified.
- [ ] Security and acceptance tests include positive and negative role/tenant cases.
- [ ] No fabricated production data, inert navigation, or future-phase surface is introduced.
- [ ] Open product-owner decisions affecting the slice are approved or shown as blockers.

## 18. Known blockers and handoff risks

- Exact Phase 0 permission identifiers are not yet implemented; navigation and action behavior cannot be finalized from role labels alone.
- The six business-rule decisions in Section 14 block final scoring, prioritization, confidence, and recovery-action UX.
- The documentation-only token set still needs complete semantic status, typography, responsive, focus, disabled, and interaction tokens plus accessibility verification before production UI.
- The secure Next.js/Supabase foundation and its initial policies/tests exist, but the expanded Phase 0 data contracts, policies, and milestone tests do not.
- No canonical Figma file, reviewed component library, responsive mockups, or licensed reference screenshots exist.
- Sample data cannot substitute for a live tenant-scoped path or satisfy product acceptance; any future sample mode requires explicit product/security rules and unmistakable labelling.

## 19. Next design step

Reconcile the design tokens, approve the permission catalogue, and obtain product-owner decisions for the six intelligence rules. Then implement Milestone A against the existing secure foundation. Later milestone surfaces become implementation-ready only when their data, permission, business-rule, and acceptance contracts pass the combined engineering/security gate.
