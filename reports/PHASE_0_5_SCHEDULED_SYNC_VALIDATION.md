# Phase 0.5 — Scheduled Sync Worker Validation

## Scope

This milestone adds scheduled sync only after Shopify and WooCommerce worker behavior has been accepted.

It is limited to:

- `data_source_sync_schedules` tenant-scoped metadata with RLS and audit evidence;
- a protected Vercel Cron route at `/api/cron/integration-sync`;
- `CRON_SECRET` authorization;
- due-schedule claiming with short locks;
- deterministic idempotency keys for scheduled `sync_jobs`;
- scheduled execution for accepted MVP provider workers only: Shopify and WooCommerce;
- existing provider handoff into raw `external_records` and normalization.

It does not add Google Sheets, OAuth, browser credential entry, webhook verification, direct canonical writes, intelligence recalculation, POS, finance, wholesale, warehouse management, forecasting, marketplace publishing, autonomous campaign execution, or real LLM agent execution.

## Security decisions

- `CRON_SECRET` is optional in `.env.example` but required for the route to run; without it the route returns 503 and does not execute.
- Vercel Cron is configured in `vercel.json` for production-only invocation.
- The route rejects missing or invalid authorization with no schedule execution.
- Schedules are tenant-owned rows and are protected by RLS for user visibility/management.
- The executor uses short locks and deterministic idempotency keys before provider access.
- Provider workers still write only to `external_records` before normalization; scheduled sync does not write directly to canonical retail tables.

## Focused validation run during implementation

```bash
npm run typecheck
npm run test -- tests/unit/scheduled-sync.test.ts tests/unit/scheduled-sync-route.test.ts tests/integration/phase0-5-integration-hub.test.ts
```

Result:

- TypeScript passed.
- 3 test files passed.
- 21 tests passed.

## Full validation run before acceptance

Run on branch `phase-0-5-scheduled-sync`:

```bash
npm run lint
npm run typecheck
npm run test
npm run security
npm run build
```

Result:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed: 26 test files, 121 tests.
- `npm run security` passed:
  - environment key-name contract;
  - service-role client boundary;
  - static dashboard scan;
  - API route protection scan for 3 route files;
  - Supabase query scope scan;
  - RLS migration contract for 44 public tables.
- `npm run build` passed: Next.js production build generated 47 app routes, including `/api/cron/integration-sync`.

Production was not changed by this local validation run. Deployment ID, production commit SHA, runtime logs, rollback target, migration status, and smoke evidence must be recorded after PR merge/deploy.
