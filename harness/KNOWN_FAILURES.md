# Known Harness Failures and Guardrails

## Active guardrails

- README, AGENTS, and reports previously drifted from current implementation state. Canonical state now lives in `harness/*.yaml`; `npm run harness:validate` checks key alignment.
- Supabase CLI migration-history/reset verification is still incomplete. CLI `2.113.0` is installed, but the current Supabase CLI account lacks access to `djvqhjgkcljdiuicdtpx`, hosted migration history is incomplete, and Docker/Podman is unavailable for local reset. Do not claim migration-history acceptance until official CLI link/list/repair and local reset evidence are recorded.
- Production route smoke does not equal authenticated workflow acceptance. The hosted synthetic Aso workflow is the current browser evidence baseline.
- Synthetic Aso evidence does not equal original consultant confirmation, pilot validation, customer validation, or recovered commercial value.
- Historical Phase 0.5 labels remain in migrations/reports as history and must not conflict with the current roadmap.

## Failure handling

If canonical YAML and reports disagree, treat it as a harness regression and stop before feature work.
