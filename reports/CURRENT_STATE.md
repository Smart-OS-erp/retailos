Project: RetailOS
Active Phase: Phase 0.5 — Integration Hub MVP
Current Mode: Phase 0.5 Milestone 5 — Import API route implementation
Build Status: Integration Hub schema/RLS foundation is implemented, merged, applied to hosted Supabase, and verified. Integration Hub setup UI is merged. RetailOS Import API boundary is merged. Import API credential/control-plane foundation is merged, applied to hosted Supabase, and verified. `/api/import/v1/records` is implemented locally on branch `phase-0-5-import-api-route` with bearer-token hashing, idempotency, safe validation, sync job creation, and `external_records` persistence only. Real connector authentication, provider sync workers, scheduled workers, and pipeline normalization from external records are not implemented yet.
Next Required Step: Review and merge the Import API route, configure `IMPORT_API_TOKEN_HASH_SECRET` in Vercel Preview, then smoke test the route with a tenant-scoped Import API credential.
