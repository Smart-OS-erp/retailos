# Open Blockers

## Phase 0.5 implementation blockers

- **Connector credential handling must be designed before any real connector authentication.** Do not paste or commit Shopify, WooCommerce, Google, webhook, SMTP, Supabase, or database secrets. Owner/action: engineering must use managed environment variables and server-only boundaries.
- **Connector depth must be selected per provider.** Phase 0.5 allows Shopify, WooCommerce, and Google Sheets connector scaffold or MVP. Owner/action: product/engineering must record whether each connector is scaffold-only or functional MVP before implementation.
- **Sync retry/rollback behavior must be explicit.** Owner/action: engineering must define idempotency keys, retry limits, error states, replay handling, and audit events before enabling scheduled sync behavior.
- **RetailOS Import API boundary must be reviewed before implementation.** Owner/action: engineering/security must accept `docs/IMPORT_API_BOUNDARY.md`, then implement credential schema, tenant scoping, replay handling, idempotency keys, rate limits, and audit evidence before exposing ingestion endpoints.

## Verified Phase 0 acceptance controls

- Phase 0 foundation is implemented, deployed, and validated.
- The reviewed foundation schema is applied to `retailos-dev`.
- The reviewed Phase 0 expansion/data/consolidation/intelligence/projectisation/Copilot migrations are applied to `retailos-dev`.
- The reviewed Phase 0.5 Integration Hub migration is applied to `retailos-dev`.
- Integration Hub UI/data-source setup flow is merged in PR #13.
- RetailOS Import API authentication/idempotency/security boundary is documented on branch `phase-0-5-import-api-boundary` and pending review.
- Supabase migration history is repaired for all seven applied Phase 0 migrations plus the applied Phase 0.5 migration.
- `npm run test:live-phase0-schema` passes against hosted Supabase after Phase 0.5 migration-history repair: 40 relation/view endpoints and 13 RPC endpoints are visible.
- `npm run test:live-supabase` passes against hosted Supabase after migration-history repair: Auth, atomic organization creation, onboarding, audit visibility, RBAC denial, anonymous denial, and two-tenant RLS are verified.
- PR #4, PR #5, PR #6, PR #7, PR #8, PR #9, PR #10, PR #11, PR #12, and PR #13 are merged.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only; custom SMTP/eligible plan support remains a production follow-up if the committed token-hash template is required.
- Production governance is accepted by founder instruction on 2026-07-12.
- Synthetic records created by live harness checks were removed by cleanup.
- Vercel project protection reports protected preview behavior, and Git fork protection is enabled.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain Phase 0 intelligence decisions. Phase 0.5 does not authorize changing them except as needed to consume newly synchronized validated data through the existing pipeline.

Phase 0.5 does not authorize POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
