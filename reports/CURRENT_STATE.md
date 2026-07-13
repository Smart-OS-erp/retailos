Project: RetailOS
Active Phase: Phase 0.5 — Integration Hub MVP
Current Mode: Phase 0.5 Milestone 4 — Import API credential/control-plane foundation
Build Status: Integration Hub schema/RLS foundation is implemented, merged, applied to hosted Supabase, and verified. Integration Hub setup UI is merged. RetailOS Import API authentication/idempotency/security boundary is merged. Import API credential metadata, token-hash storage, idempotency/replay evidence, and rate-limit evidence are implemented locally on branch `phase-0-5-import-api-credentials`. Import API route implementation, real connector authentication, provider sync workers, scheduled workers, and pipeline normalization from external records are not implemented yet.
Next Required Step: Review and merge the Import API credential/control-plane foundation, apply the new migration to hosted Supabase, then build `/api/import/v1/records` against the reviewed controls.
