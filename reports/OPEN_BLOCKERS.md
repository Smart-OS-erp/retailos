# Open Blockers

## Active technical blockers

### Supabase CLI migration-history/reset verification

Status: open.

Evidence: the local shell does not have verified Supabase CLI migration-history/reset evidence recorded. Hosted SQL checks have passed for prior milestones, but that is not equivalent to `supabase migration list`, `supabase db reset`, or local migration-history reconciliation.

Owner action: install/authenticate Supabase CLI, link the approved project, run safe migration-history/reset verification, and record evidence.

### Main branch protection

Status: closed.

Evidence: GitHub branch protection was enabled by API on 2026-08-10 with required `Quality` and `Security foundation checks`, required PR review, stale review dismissal, no force-push, and no branch deletion.

### Repository security automation

Status: closed for current baseline.

Evidence: `.github/dependabot.yml` configures weekly npm and GitHub Actions dependency PRs; Dependabot opened PRs #53-#59. GitHub vulnerability alerts were enabled by API on 2026-08-10.

Owner/action: periodically triage Dependabot PRs. PR #57 currently has a failing Quality check and should not be merged blindly.

## Active product/domain gates

### Phase 0 conditional acceptance gates

Status: open.

- Authenticated browser acceptance incomplete.
- Authenticated production synthetic workflow incomplete.
- Original consultant review pending.
- Real retailer pilot pending.

These are not satisfied by route smoke, synthetic data, or internal tests.

### Repository visibility

Status: human gate.

The repository is public. Do not change public/private visibility without explicit human approval.

### Google Sheets worker

Status: deferred.

Shopify and WooCommerce MVP-depth workers exist. Google Sheets remains deferred and is not part of Phase 2B M2.7-M2.9.

## Phase 2B stop gate

### M2.12 Retail Domain Validation

Status: human/domain gate.

M2.12 cannot be accepted without original consultant or approved independent domain reviewer evidence. Internal deterministic tests and synthetic Aso data are not enough.

## Verified controls

- Production URL: https://retailos-ten.vercel.app.
- Latest inspected production deployment at Phase 2B start: `dpl_bggBQ7SmTeTymHkacYpqiBS1LNSp`, Ready.
- Phase 0 M0.20 Aso Collective dataset is accepted as `INTERIM_DOMAIN_BASELINE`.
- Phase 0 M0.21 is `CONDITIONALLY_ACCEPTED`.
- Phase 1 inventory core exists and was deployed.
- Phase 2A M2.0-M2.6 exists and was deployed.
- Phase 2B M2.7-M2.11 is accepted.
- M2.12 is the exact next milestone and is gated by domain review.

## Historical notes

Historical Phase 0.5 labels remain in migrations and reports. The current roadmap treats those capabilities as Phase 0 integration/data-foundation history.

M0-UI is not the current next milestone. Phase 2B M2.7-M2.9 is the current approved campaign.
