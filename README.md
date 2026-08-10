# RetailOS

RetailOS is secure operating intelligence for African fashion retail. It helps retailers move from fragmented inventory, sales, integration, and merchandising data to trusted operating decisions.

The first wedge is inventory recovery intelligence: validate messy retail data, consolidate it, identify inventory risk, explain recovery opportunities, projectise action, and support permission-aware operating workflows.

RetailOS is not positioned as a generic ERP, POS, accounting package, WMS, static dashboard, or chatbot. The initial wedge is inventory recovery intelligence; the end state may progressively absorb approved operating, system-of-record, and transactional capabilities required for a fashion retailer operating system.

## Current maturity

Current campaign: Phase 2B — Engineering Reconciliation, Domain Validation and Pilot Readiness.

Approved scope for this campaign:

- M2.7 — Repository Governance and Release Discipline.
- M2.8 — Harness Simplification and Product Reconciliation.
- M2.9 — Senior SWE Codebase Readiness Review.
- M2.11 — Aso Inventory + Merchandising Dataset Expansion.

Stop after M2.11. M2.12 requires original consultant or approved independent domain-review evidence.

Current verified product state:

- Phase 0 M0.20 Aso Collective dataset is accepted as an `INTERIM_DOMAIN_BASELINE`.
- Phase 0 M0.21 is `CONDITIONALLY_ACCEPTED`.
- Phase 1 core inventory operating workflows exist and were deployed.
- Phase 2A M2.0-M2.6 light merchandising intelligence and action planning exists and was deployed.
- M2.10 Retail Operating Model v0.9 is already satisfied by M0.20 evidence.
- M2.11 Aso Inventory + Merchandising Dataset Expansion is accepted.

## Stack

- Next.js App Router
- React
- TypeScript strict mode
- Supabase Auth/Postgres/RLS
- Vitest
- GitHub Actions
- Vercel

## Architecture overview

RetailOS is a modular Next.js/Supabase SaaS:

- `src/app/` contains routes, route handlers, and server actions.
- `src/components/` contains shared UI and workflow page components.
- `src/lib/auth/` contains authorization and organization-context helpers.
- `src/lib/intelligence/` contains deterministic intelligence logic.
- `src/lib/integrations/` contains provider and sync workers.
- `src/lib/import-api/` contains import API contracts, hashing, and storage boundaries.
- `supabase/migrations/` contains immutable schema evolution.
- `tests/` contains unit, integration, and security coverage.
- `harness/` contains canonical roadmap, milestone, gate, and workflow control.

Business rules must not be silently duplicated across SQL, TypeScript, UI, and Copilot paths.

## Repository structure

```text
.github/              CI, security workflows, CODEOWNERS, Dependabot
data/demo/            Synthetic Aso Collective fixtures
docs/                 Product, security, domain, setup, and acceptance docs
harness/              Canonical machine-readable roadmap and gates
reports/              Current state, blockers, failures, and acceptance evidence
scripts/              Validation, security, migration, demo, and harness scripts
src/                  Application source
supabase/             Supabase migrations, seed, and setup notes
tests/                Unit, integration, e2e placeholder, and security tests
```

## Local setup

Use Node 22.x:

```bash
npm ci
cp .env.example .env.local
```

Fill `.env.local` locally. Do not paste or commit secrets.

Required variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

`SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client/browser code.

## Supabase and migrations

Migrations live in `supabase/migrations/` and are immutable once applied.

Rules:

- prefer expand-contract migrations;
- do not edit applied migrations;
- destructive migrations require a human gate;
- Vercel rollback does not roll back database state;
- migration history disagreement is a technical stop.

Supabase CLI migration-history/reset verification remains an explicit open gap until the CLI is installed/authenticated and results are recorded.

## Aso Collective dataset

Aso Collective is a deterministic synthetic African fashion retailer dataset.

- Current dataset version: `ASO_MERCHANDISING_PILOT_V3`
- Historical lineage: `ASO_PHASE0_DATASET_V1` → `ASO_INVENTORY_OPERATIONS_V2` → `ASO_MERCHANDISING_PILOT_V3`
- Data classification: synthetic demo data only
- Domain validation level: `INTERIM_DOMAIN_BASELINE`

Commands:

```bash
npm run demo:seed
npm run demo:verify
npm run demo:reset
npm run demo:cleanup
```

These commands write local ignored state under `.tmp/demo/aso-collective`.

## Validation

Run all supported checks before release:

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

For dataset changes, also run the Aso demo commands.

## Deployment

Production is hosted on Vercel:

```text
https://retailos-ten.vercel.app
```

Every release should record structured evidence with commit SHA, deployment ID, environment, migration hash where applicable, dataset version where applicable, timestamp, verification type, verifier, and result.

## Business-rule pointers

- Product source: `docs/PRODUCT_SOURCE_OF_TRUTH.md`
- Business rule contract: `docs/domain/BUSINESS_RULE_CONTRACT.md`
- Phase 0 scope: `docs/PHASE_0_SCOPE.md`
- Phase 1 scope: `docs/PHASE_1_SCOPE.md`
- Phase 2 scope: `docs/PHASE_2_SCOPE.md`
- Retail operating model: `docs/domain/RETAIL_OPERATING_MODEL_V0_9.md`
- Aso dataset: `docs/demo/ASO_COLLECTIVE_DATASET.md`
- Security architecture: `docs/security/SECURITY_ARCHITECTURE.md`

## Roadmap pointer

The canonical roadmap is machine-readable:

- `harness/roadmap.yaml`
- `harness/milestones.yaml`
- `harness/quality-gates.yaml`
- `harness/human-gates.yaml`

Do not treat README as the project database.

## Known limitations

- Phase 0 is conditionally accepted, not fully pilot/customer validated.
- Authenticated browser acceptance and authenticated production synthetic workflow acceptance remain incomplete.
- Original consultant review and real retailer pilot validation remain pending.
- Supabase CLI migration-history/reset verification remains pending.
- Phase 2A recommendations are directional; they are not advanced forecasting or autonomous execution.
- M2.12 is not approved without domain-review evidence.
- Purchasing, WMS, omnichannel, POS, finance, wholesale, payments, and Phase 2C are not approved in the current campaign.
