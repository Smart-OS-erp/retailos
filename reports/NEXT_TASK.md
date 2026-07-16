Next Task:
Complete, review, and merge Phase 0.5 — Scheduled Sync Worker.

Required before acceptance:

- Vercel Cron is configured to call `/api/cron/integration-sync`.
- The cron route fails closed unless `Authorization` matches `Bearer ${CRON_SECRET}`.
- Scheduled sync metadata is tenant-scoped, RLS-protected, and audited.
- The scheduled executor claims due schedules with a short lock before provider access.
- Scheduled jobs use deterministic idempotency keys and `trigger = 'scheduled'`.
- Only accepted MVP provider workers run through scheduled sync; currently Shopify and WooCommerce.
- Scheduled sync writes provider data only to raw `external_records` through existing provider workers and then hands off to normalization.
- No scheduled path writes directly to canonical product, location, sales, inventory, intelligence, projectisation, or campaign tables.
- Missing unsupported providers fail closed and do not fake successful schedules.
- Unit and integration tests cover route authorization, schedule RLS/audit, idempotency reuse, due-schedule claiming, and normalization handoff.
- lint, typecheck, test, security, and build pass.

Next Approved Phase 0.5 Work After Acceptance:

- Add product/location/sales canonical write approval flows.
- Add automatic intelligence recalculation after normalized imports.
- Implement the Google Sheets provider worker only after scheduled sync/approval/recalculation priorities are explicitly ordered.

Do not start Phase 1. Do not add POS, finance, wholesale, forecasting, warehouse management, marketplace publishing, autonomous campaign execution, or real LLM agent execution.
