# M0-R Release Checkpoint — Production Hardening

## Checkpoint

M0-R — Harness Reconciliation and Production Hardening

## Commit and Deployment

- Commit SHA: `d19a4635d32bfc5b0d26916e3efbd8603e751372`
- Production deployment: `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`
- Production URL: `https://retailos-ten.vercel.app`
- Previous rollback candidate: `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZL`

## Migration Set

Repository migrations:

1. `20260705113000_secure_technical_foundation.sql`
2. `20260705140000_phase0_foundation_expansion.sql`
3. `20260706100000_phase0_data_foundation.sql`
4. `20260706110000_phase0_consolidation_hub.sql`
5. `20260706120000_phase0_inventory_recovery_intelligence.sql`
6. `20260706130000_phase0_projectisation_engine.sql`
7. `20260706140000_phase0_retail_copilot.sql`
8. `20260707100000_phase0_5_integration_hub.sql`
9. `20260713160000_phase0_5_import_api_credentials.sql`
10. `20260715133000_phase0_5_pipeline_handoff.sql`
11. `20260715143000_phase0_5_record_type_mappings.sql`
12. `20260715152000_phase0_5_provider_mvp_promotion.sql`

Hosted schema live verification passed during M0-R after these migrations, but Supabase CLI migration-history inspection is not verified in this shell because the CLI is not installed.

## Verified Workflows

- Production `/login` returns 200.
- Production `/signup` returns 200.
- Production `/workspace` redirects unauthenticated users to `/login`.
- Production Import API smoke passed with synthetic tenant-scoped credential creation, one `inventory_snapshot` external record, idempotent replay, and cleanup.
- Hosted schema verification passed for 44 relation/view endpoints and 16 RPC endpoints.
- Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passed.

## Verified Security Controls

- No secrets printed or committed during the M0-R env repair.
- Production `DATABASE_URL` replaced as a sensitive Vercel variable.
- Import API unauthenticated and invalid paths remain designed to fail closed.
- Service-role and database credentials remain server-only by design.
- Vercel project Node setting aligned to `22.x`.
- Vercel secret scanning and push protection are enabled.

## Known Limitations

- Supabase CLI migration history is not verified in this shell.
- Local `supabase db reset` is not run in this shell.
- Shopify live provider sync has not been run with real provider credentials.
- WooCommerce and Google Sheets workers are not implemented.
- Product/location/sales canonical write approval flows are not implemented.
- Automatic intelligence recalculation after normalized external records is not implemented.

## Known Runtime Issues

Resolved during M0-R:

- Production Import API returned `500 internal_error` with correlation ID `f9424e58-9bad-4b9e-8300-db956923fafa`.
- Runtime log cause: Postgres `28P01` password authentication failed for user `postgres`.
- Resolution: Production `DATABASE_URL` replaced from ignored secret management and production redeployed as `dpl_4CqnHGwofAfUMYKrM8ezBYWZopfE`.

Post-resolution runtime inspection found no error/fatal logs for the current production deployment in the inspected window.

## Open Blockers

- Install/authenticate Supabase CLI and reconcile migration history.
- Protect GitHub `main` branch.
- Decide repository visibility.
- Enable Dependabot security updates if founder approves.
- Provide reviewed server-only provider credentials before live Shopify sync acceptance.

## GitHub Governance Snapshot

- Repository: public.
- `main` branch protection: not enabled at inspection time.
- Secret scanning: enabled.
- Secret scanning push protection: enabled.
- Dependabot security updates: disabled.
- Open PRs at inspection time: none.
- Stale merged branches visible locally: deleted during M0-R.

## Rollback Target

- Immediate rollback candidate: `dpl_GRtstzmsa2uo5fd3XUdPyPU6VvZL`.
- Caveat: rollback would restore the same code commit but may require keeping the corrected Production `DATABASE_URL`.

## Next Milestone

M0-UI — RetailOS UI Foundation Implementation, after M0-R is reviewed and accepted.
