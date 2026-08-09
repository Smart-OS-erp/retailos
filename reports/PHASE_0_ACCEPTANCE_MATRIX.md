# Phase 0 Acceptance Matrix

Date: August 9, 2026

Dataset: `ASO_PHASE0_DATASET_V1`

Final technical decision source: `reports/PHASE_0_FINAL_DECISION.md`

| Area | Result | Evidence |
| --- | --- | --- |
| Raw synthetic source data | Passed | Aso Collective fixtures under `data/demo/aso-collective` |
| Upload/import staging | Passed | `tests/integration/phase0-end-to-end-acceptance.test.ts` |
| Schema validation | Passed | Existing migrations plus integration test setup |
| Row validation | Passed | Warning and blocking validation issue assertions |
| Correction/review | Passed | `accept_inventory_upload_warnings` path |
| Rejection | Passed | Blocked upload rejects consolidation |
| SKU identity resolution | Passed with current implementation | Consolidation creates deterministic canonical SKU/product records from staged rows |
| Canonical approval | Passed with current implementation | `consolidate_inventory_upload` creates canonical inventory snapshot/positions |
| Consolidation | Passed | Idempotent consolidation retry returns original run |
| Operating View | Passed | `current_inventory_positions` returns consolidated rows |
| Freshness/confidence | Passed | `inventory_risk_insights` confidence fields verified |
| Inventory aging | Passed | Intelligence run over seeded Aso rows with receipt/first-availability evidence |
| Risk calculation | Passed | `run_inventory_recovery_intelligence` creates risk insights |
| Attention Queue | Passed with current implementation | Recovery opportunity priority score verified |
| Recovery opportunity | Passed | Open opportunity created from persisted intelligence |
| Ranked recovery action | Passed with current implementation | Top opportunity selected by attention priority |
| Recovery project | Passed | `create_recovery_project` creates project from opportunity |
| Approval | Passed | Executive approval path verified and self-approval avoided |
| Campaign brief | Passed | Campaign brief created and approved |
| Tasks | Passed | Project tasks created; task transition to `in_progress` verified |
| Copilot explanation | Passed | `get_retail_copilot_answer('project', projectId)` returns answered, cited, non-executing response |
| Tenant isolation | Passed | Other tenant cannot see Aso inventory |
| Role isolation | Passed | Viewer cannot run intelligence |
| Location isolation | Passed | Store manager sees only assigned location inventory |
| Source lineage | Passed | Consolidation item source evidence points to source upload |
| Browser acceptance | Conditional | Build and route availability pass, but authenticated browser workflow was not fully exercised in this shell |
| Mobile acceptance | Conditional | Existing responsive shell/build verified; no dedicated mobile browser run in this shell |
| Accessibility | Conditional | Existing UI baseline tests pass; no dedicated assistive-technology pass |
| Production smoke | Conditional | Unauthenticated production routes pass; authenticated synthetic production workflow not run |
| Runtime review | Passed | Vercel error logs were empty in inspected M0.20 window; M0.21 production review pending PR merge |
| Synthetic cleanup | Passed locally | `npm run demo:cleanup` removes local ignored seed state and verifies fixtures |

## Decision

Phase 0 is technically conditionally accepted pending the explicitly listed production/browser/Supabase CLI evidence gaps.
