# Known Harness Failures

## Placeholder drift

**Failure:** a TODO check continues to exit successfully after relevant product code exists.  
**Prevention:** application-scaffold and feature PRs must replace affected placeholders with enforceable checks.

## Phase leakage

**Failure:** future roadmap items appear as routes, tables, navigation, fake dashboards, or demos during Phase 0.  
**Prevention:** compare every diff with `reports/CURRENT_STATE.md` and `docs/PHASE_0_SCOPE.md`.

## Security theatre

**Failure:** UI role checks or query filters are described as tenant isolation without API and RLS enforcement.  
**Prevention:** require negative tests at UI/API/database layers and two-tenant policy evidence.

## Heuristic confidence

**Failure:** static scanners are treated as proof that routes and queries are safe.  
**Prevention:** call scanners heuristic and pair them with integration/policy tests once code exists.

## False green CI

**Failure:** placeholder lint/test/build steps are read as product validation.  
**Prevention:** steps print explicit TODO/not-applicable notices and validation reports preserve that distinction.

## Unreproducible platform state

**Failure:** Supabase/Vercel dashboard settings exist without migrations/configuration/evidence.  
**Prevention:** capture configuration as code where supported and maintain reviewed setup evidence.
