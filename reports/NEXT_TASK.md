Next Task:
Choose one approved next implementation lane after the relevant harness PR is reviewed and merged.

Lane A — Phase 0.5 Integration Hub MVP:
- Validate, review, merge, and deploy the Shopify MVP worker branch.
- After Shopify worker acceptance, implement one remaining provider-specific MVP worker at a time.
- Use server-only credential handling, retries, external record writes, normalization tests, and sync evidence.
- Shopify may run through the server-only MVP worker when a reviewed server-side credential entry exists. WooCommerce and Google Sheets may create `mvp` data sources, but must remain credential-gated until their provider workers are implemented.
- Keep POS/ERP and custom backend scaffold/import-API paths unless a later phase explicitly approves direct connectors.
- Keep the rule that RetailOS connects to the system behind a website, not to "a website" directly.

Verified:
- Hosted Phase 0.5 pending migrations are applied:
  - `20260715133000_phase0_5_pipeline_handoff.sql`
  - `20260715143000_phase0_5_record_type_mappings.sql`
  - `20260715152000_phase0_5_provider_mvp_promotion.sql`
- Hosted schema/RLS verification passes for 44 relation/view endpoints and 16 RPC endpoints.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passes.
- Vercel production deployment `dpl_D4MdYF9QRAQQwxa83GekhncvcCLZ` is READY.
- Live root route redirects safely to login.
- `npm run smoke:import-api -- --url https://retailos-ten.vercel.app` passes against production after Supabase DB password rotation and Vercel Production `DATABASE_URL` update to the working pooler URL on port `6543`.

Do not build outside the selected approved lane. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.

Approved Next Implementation Prompt — M0.9 RetailOS UI Foundation:

After this harness update is reviewed and merged, a human may explicitly start M0.9 with this prompt:

```text
Implement M0.9 — RetailOS UI Foundation.

Stay inside the approved Phase 0 UI foundation milestone.
Do not finalize product requirements, module structure, workflow language, roles, statuses, suppliers, warehouse terminology, finance terminology, or demo records.
Do not build broad product dashboards or product screens as final behavior.

Implement the shared frontend foundation only:
- design tokens
- shadcn/ui foundation
- shared application shell
- responsive navigation and topbar primitives
- organization switcher
- user menu
- global search shell
- central navigation configuration
- central dashboard configuration
- tenant market defaults
- Nigeria/en-NG/NGN/Africa-Lagos demo defaults, implemented with the `Africa/Lagos` timezone identifier, unless tenant settings override them
- shared currency/date/timezone formatting utilities
- reusable KPI cards
- chart cards
- activity feed primitives
- stock-location primitives
- RetailDataGrid
- central status presentation
- loading, empty, error, forbidden, stale, and success states
- accessibility baseline
- responsive behavior
- documentation
- tests

Use shadcn/ui. Do not use Ant Design.
New pages must use the shared shell.
New tables must use RetailDataGrid unless an approved exception is documented.
UI modules must not manually concatenate currency symbols.
All placeholder navigation, KPIs, card ordering, statuses, workflows, roles, suppliers, locations, and demo records must be clearly marked provisional and replaceable after retail-consultant validation.
```
