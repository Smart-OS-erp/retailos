# M0.20 Acceptance Evidence - Aso Collective Phase 0 Demo Dataset

Date: August 9, 2026

## Scope

M0.20 established the persistent `continue autonomously` command, reconciled the Phase 0 ending milestones, created the interim RetailOS African Fashion Retail Operating Model v0.9, and added deterministic synthetic Aso Collective dataset version `ASO_PHASE0_DATASET_V1`.

## GitHub

- Pull request: https://github.com/Smart-OS-erp/retailos/pull/48
- Merge commit: `1da884ba5357bf3214f4e7cb9c108d845fe687a4`

## Validation

| Command | Outcome |
| --- | --- |
| `git diff --check` | Passed |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test` | Passed: 29 files, 137 tests |
| `npm run security` | Passed |
| `npm run build` | Passed |
| `npm audit --audit-level=moderate` | Passed: 0 vulnerabilities |
| `npm run demo:seed` | Passed |
| `npm run demo:verify` | Passed |
| `npm run demo:reset` | Passed |
| `npm run demo:cleanup` | Passed |

## Dataset evidence

- Dataset name: Aso Collective Phase 0 Demo Dataset.
- Dataset version: `ASO_PHASE0_DATASET_V1`.
- Organisation: Aṣọ Collective / `aso_collective`.
- Locations: 5.
- Styles: 60.
- SKUs: 240.
- History period: 10 monthly periods ending `2026-07-31`.
- Inventory rows: 1,200.
- Sales rows: 12,000.
- Messy data scenarios: 20.
- Retail scenarios: 25.
- Data classification: synthetic demo data only.

## Preview and production

- PR checks passed: Quality, Security foundation checks, Vercel preview, and Vercel Preview Comments.
- Preview deployment: `https://retailos-n7laj6000-tonybabalola-1114s-projects.vercel.app`
- Preview error logs: no logs found in the inspected window.
- Production deployment: `dpl_EoD82JboiPDxMDLR2SzYGvaisejA`.
- Production URL: `https://retailos-ten.vercel.app`.
- Production smoke:
  - `/` returned 307.
  - `/login` returned 200.
  - `/setup-error` returned 200.
- Production error logs: no logs found in the inspected window.

## Known conditions

- M0.20 does not claim Phase 0 final acceptance.
- M0.21 must prove the full Phase 0 end-to-end journey.
- Supabase CLI migration-history/reset remains unverified in this shell.
