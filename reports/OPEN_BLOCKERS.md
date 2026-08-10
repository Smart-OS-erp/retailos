# Open Blockers

## Active technical blockers

### Supabase CLI migration-history/reset verification

Status: open.

Evidence: the local shell does not have verified Supabase CLI migration-history/reset evidence recorded. Hosted SQL checks have passed for prior milestones, but that is not equivalent to `supabase migration list`, `supabase db reset`, or local migration-history reconciliation.

Owner action: install/authenticate Supabase CLI, link the approved project, run safe migration-history/reset verification, and record evidence.

### Main branch protection

Status: open until verified enabled.

Evidence: GitHub branch protection API returned `404 Not Found` for `main` during Phase 2B start inspection. This means protection is absent or unavailable to the current token.

Owner/action: enable or verify branch protection requiring PRs, Quality check, Security foundation checks, no force-push, and no deletion where practical.

### Repository security automation

Status: partially addressed.

Evidence: `.github/dependabot.yml` now configures weekly npm and GitHub Actions dependency PRs. GitHub vulnerability-alert API returned `404 Not Found` during inspection, so repository-level Dependabot/security alert enablement is not verified through API.

Owner/action: verify GitHub repository security settings in the web UI or with an admin token.

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

## Verified controls

- Production URL: https://retailos-ten.vercel.app.
- Latest inspected production deployment at Phase 2B start: `dpl_bggBQ7SmTeTymHkacYpqiBS1LNSp`, Ready.
- Phase 0 M0.20 Aso Collective dataset is accepted as `INTERIM_DOMAIN_BASELINE`.
- Phase 0 M0.21 is `CONDITIONALLY_ACCEPTED`.
- Phase 1 inventory core exists and was deployed.
- Phase 2A M2.0-M2.6 exists and was deployed.
- Phase 2B M2.7-M2.9 is explicitly approved.

## Historical notes

Historical Phase 0.5 labels remain in migrations and reports. The current roadmap treats those capabilities as Phase 0 integration/data-foundation history.

M0-UI is not the current next milestone. Phase 2B M2.7-M2.9 is the current approved campaign.
