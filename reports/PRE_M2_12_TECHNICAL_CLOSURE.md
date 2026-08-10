# Pre-M2.12 Technical Closure Evidence

Date: 2026-08-10

Status: technical closure partially completed. M2.12 is not started and not accepted.

## Correction 1 — cross-layer business-rule parity

Decision: completed for current technical scope.

- Added machine-readable implementation map: `src/lib/business-rules/rule-registry.ts`.
- Added database parity/discrepancy test: `tests/integration/business-rule-database-parity.test.ts`.
- Confirmed `inventory.available_quantity` parity for the selected Aso-compatible input:
  - SQL: `public.current_inventory_balances.available_quantity`
  - TypeScript: `calculateAvailableInventory`
  - Golden-compatible expected value: `64`
- Classified `public.product_productivity_metrics.sell_through_rate_90` as `HISTORICAL_COMPATIBILITY` / `VERSION_DIFFERENCE`, not equivalent net sell-through:
  - TypeScript/golden v0.9 net sell-through: `0.0556`
  - SQL historical 90-day productivity percentage: `5.88`

No applied migration was edited. No SQL behavior was silently rewritten.

## Correction 2 — semantic source-of-truth drift

Decision: completed for deterministic current-facing drift.

Fixed or strengthened:

- README latest Aso dataset now points to `ASO_MERCHANDISING_PILOT_V3` and preserves V1 → V2 → V3 lineage.
- Product reconciliation now states M2.7-M2.11 accepted and M2.12 gated.
- Senior SWE review no longer leaves branch protection as currently unremediated.
- Phase scope docs no longer imply Phase 2B is only M2.7-M2.9.
- Harness validation now fails on stale M2.7-M2.9-only language and synthetic `PILOT_VALIDATED` / `CUSTOMER_VALIDATED` labels.

## Correction 3 — product doctrine locked into harness

Decision: completed.

Canonical strategic invariants were added to `harness/roadmap.yaml`:

- `wedge-vs-end-state`
- `shared-os-kernel`
- `country-awareness-in-core`
- `planning-execution-boundary`
- `retailer-validation-gates-expansion`
- `phase-12-optional`

## Supabase CLI and migration reproducibility

Decision: still technically blocked, but no longer blocked by missing CLI.

- Supabase CLI installed as a project-scoped dev dependency: `2.113.0`.
- Official project-scoped npm installation path was used.
- `npx supabase link --project-ref djvqhjgkcljdiuicdtpx` failed because the current Supabase CLI account lacks privileges for the target project.
- `docker` and `podman` are not available on PATH, so `supabase db reset` cannot run in this shell.
- Hosted database inspection through approved `DATABASE_URL` succeeded without printing secrets.

Hosted migration history comparison:

- Repository migrations: `20`
- Hosted `supabase_migrations.schema_migrations` rows: `9`
- Missing hosted history entries:
  - `20260715133000 phase0_5_pipeline_handoff`
  - `20260715143000 phase0_5_record_type_mappings`
  - `20260715152000 phase0_5_provider_mvp_promotion`
  - `20260716214000 phase0_5_scheduled_sync`
  - `20260716223000 phase0_5_canonical_approval_flows`
  - `20260716233000 phase0_5_auto_intelligence_recalculation`
  - `20260718093000 phase1_inventory_core_foundations`
  - `20260718103000 phase1_inventory_operations_core`
  - `20260718120000 phase1_m1_9_inventory_completion`
  - `20260718210000 phase1_visible_workflow_acceptance`
  - `20260718213000 phase2_merchandising_planning_m0_m6`

Hosted schema spot-check found key Phase 1/2 relations exist despite incomplete migration history, including inventory movements, transfers, stock counts, merchandising recommendations, markdown drafts, merchandising plan cycles, and `product_productivity_metrics`.

Required closure action: authenticate Supabase CLI with an account that has access to `djvqhjgkcljdiuicdtpx`, then use official migration-history repair only after exact applied-state verification. Do not directly fake migration history.

## Hosted Aso demo tenant

Decision: completed for current stable production environment.

- URL: `https://retailos-ten.vercel.app`
- Supabase project ref from local approved env: `djvqhjgkcljdiuicdtpx`
- Organization: `Aṣọ Collective`
- Slug: `aso-collective`
- Dataset: `ASO_MERCHANDISING_PILOT_V3`
- Role: `ORG_OWNER`
- Synthetic marker: stored in Auth metadata and seeded evidence JSON where current schema supports metadata.

Commands:

- `npm run demo:hosted:provision` passed.
- `npm run demo:hosted:verify` passed.
- `npm run demo:hosted:browser` passed for desktop and mobile viewport.

Authenticated hosted verification result:

- authenticated: true
- locations: 5
- inventory balances: 6
- merchandising recommendations: 2
- markdown drafts: 1
- organization: `Aṣọ Collective`

## Phase 0 condition closure

- Authenticated browser acceptance: closed for the synthetic Aso production workflow.
- Authenticated production synthetic workflow: closed for the synthetic Aso production workflow.
- Original consultant review: still open.
- Real retailer pilot: still open.
- Supabase migration-history/reset reproducibility: still open due CLI project-access and local Docker/Podman blockers.

## M2.12 review packet

Prepared at:

- `docs/domain/M2_12_DOMAIN_REVIEW_PACKET.md`

M2.12 remains the exact next milestone and requires approved domain-review evidence.
