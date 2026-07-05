# Open Blockers

## Harness milestone

The environment-name contract can be completed in the harness. Product scaffolding remains blocked until draft PR #1 is reviewed and merged, as required by `reports/CURRENT_STATE.md` and `reports/NEXT_TASK.md`.

**Owner/action:** repository owner reviews and merges the harness PR, then explicitly updates the current mode/build status before technical-foundation implementation begins.

## Deferred product decisions

These do not block the harness PR, but must be resolved before the affected implementation:

- Approve exact inventory recovery age bands, analysis windows, cost basis, confidence thresholds, and action catalogue.
- Confirm production privacy/legal owners, retention requirements, and incident contacts before real tenant/personal data.
- Provision and separate Supabase/Vercel environments only during an approved technical-foundation task.
