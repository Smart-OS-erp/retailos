# Open Blockers

## Phase 0.5 implementation blockers

- **Connector credential handling must be designed before any real connector authentication.** Do not paste or commit Shopify, WooCommerce, Google, webhook, SMTP, Supabase, or database secrets. Owner/action: engineering must use managed environment variables and server-only boundaries.
- **Connector depth must be selected per provider.** Phase 0.5 allows Shopify, WooCommerce, and Google Sheets connector scaffold or MVP. Owner/action: product/engineering must record whether each connector is scaffold-only or functional MVP before implementation.
- **Sync retry/rollback behavior must be explicit.** Owner/action: engineering must define idempotency keys, retry limits, error states, replay handling, and audit events before enabling scheduled sync behavior.

## Verified Phase 0 acceptance controls

- Phase 0 foundation is implemented, deployed, and validated.
- The reviewed foundation schema is applied to `retailos-dev`.
- The reviewed Phase 0 expansion/data/consolidation/intelligence/projectisation/Copilot migrations are applied to `retailos-dev`.
- Supabase migration history is repaired for all seven applied Phase 0 migrations.
- `npm run test:live-phase0-schema` passes against hosted Supabase after migration-history repair: 34 relation/view endpoints and 11 RPC endpoints are visible.
- `npm run test:live-supabase` passes against hosted Supabase after migration-history repair: Auth, atomic organization creation, onboarding, audit visibility, RBAC denial, anonymous denial, and two-tenant RLS are verified.
- PR #4, PR #5, PR #6, PR #7, and PR #8 are merged.
- Current Supabase hosted confirmation email behavior is accepted for the protected non-production demo only; custom SMTP/eligible plan support remains a production follow-up if the committed token-hash template is required.
- Production governance is accepted by founder instruction on 2026-07-12.
- Synthetic records created by live harness checks were removed by cleanup.
- Vercel project protection reports protected preview behavior, and Git fork protection is enabled.

## Deferred product decisions

Inventory recovery thresholds, analysis windows, cost basis, confidence levels, and action catalog remain Phase 0 intelligence decisions. Phase 0.5 does not authorize changing them except as needed to consume newly synchronized validated data through the existing pipeline.

Phase 0.5 does not authorize POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
