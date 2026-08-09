# RetailOS

RetailOS is secure operating intelligence for African fashion retail. Its first wedge is inventory recovery intelligence: trustworthy retail data intake, validation, consolidation, inventory risk explanation, recovery opportunities, projectisation, campaign briefs, tasks, and permission-aware Copilot explanations.

RetailOS is not a generic ERP, POS, static dashboard, or chatbot.

## Current campaign

Active phase: Phase 0 - Foundation: Inventory Recovery Intelligence.

Active milestone: M0.20 - Aso Collective Phase 0 Demo Dataset.

Next milestone: M0.21 - Phase 0 End-to-End Acceptance and Hardening.

The historical Phase 0.5 label remains in migrations and reports for development history. Its capabilities are now treated as Phase 0 integration and data-foundation milestones.

Do not start Phase 2B, Phase 2C, Phase 3, purchasing, WMS, finance, omnichannel, or POS during this campaign.

## Autonomous continuation

The repository owner command:

```text
continue autonomously
```

is a persistent repository command. Future Codex sessions must resolve the next eligible milestone from the authoritative roadmap and current evidence, then continue automatically until a mandatory human gate or technical stop condition is reached. See `AGENTS.md` and `harness/AGENT_WORKFLOW.md`.

## Implemented foundation

- Next.js App Router with strict TypeScript and security headers.
- Supabase SSR clients for browser, server, and proxy boundaries.
- Email/password auth, signup, login, confirmation, logout, and server-side user verification.
- Organization creation, onboarding, company/location/brand/team/data-source setup, and role-aware protected routes.
- Organizations, memberships, RBAC, audit events, tenant-scoped tables, forced RLS, and deny-by-default grants.
- Phase 0 data intake, staging, validation, consolidation, Operating View, inventory recovery, projectisation, task, campaign brief, workspace, and deterministic Retail Copilot routes.
- Historical Phase 0.5 Integration Hub, Import API, Shopify/WooCommerce MVP workers, scheduled sync, canonical approval flows, and automatic intelligence recalculation evidence.
- M0-UI shared frontend foundation.
- Phase 1 inventory core and visible workflow acceptance.
- Phase 2 M2.0-M2.6 merchandising/planning work was merged before the Phase 0 roadmap reconciliation.

## Aso Collective synthetic dataset

Dataset documentation:

- `docs/demo/ASO_COLLECTIVE_DATASET.md`
- `docs/demo/ASO_COLLECTIVE_DEMO_SCRIPT.md`
- `docs/domain/RETAIL_OPERATING_MODEL_V0_9.md`

Dataset version: `ASO_PHASE0_DATASET_V1`.

Commands:

```bash
npm run demo:seed
npm run demo:verify
npm run demo:reset
npm run demo:cleanup
```

The demo commands use deterministic synthetic data only. They must not use real retailer data, secrets, plaintext passwords, destructive production actions, or external-system write-back.

## Production

Production alias: `https://retailos-ten.vercel.app`

Current production state is recorded in `reports/CURRENT_STATE.md`.

## Local setup

1. Use Node 22.
2. Run `npm ci`.
3. Create ignored `.env.local` from `.env.example`.
4. Keep real values local or in managed deployment settings; never commit or paste them into chat, logs, screenshots, or fixtures.
5. Apply reviewed migrations to a non-production Supabase environment before exercising hosted workflows.
6. Run `npm run dev`.

Required variable names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
IMPORT_API_TOKEN_HASH_SECRET
SHOPIFY_CONNECTOR_CREDENTIALS_JSON
WOOCOMMERCE_CONNECTOR_CREDENTIALS_JSON
CRON_SECRET
```

`SUPABASE_SERVICE_ROLE_KEY` must never appear in browser/client code.

## Validation

Run relevant checks before handoff:

```bash
npm run lint
npm run typecheck
npm run test
npm run security
npm run build
npm audit --audit-level=moderate
```

For M0.20 also run:

```bash
npm run demo:seed
npm run demo:verify
npm run demo:reset
npm run demo:cleanup
```

## Known blockers

See `reports/OPEN_BLOCKERS.md`. Current standing blockers include Supabase CLI migration-history/reset verification, GitHub `main` branch protection, Dependabot security updates, repository visibility decision, and Google Sheets worker deferral.
