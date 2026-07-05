# Business Rules

## Rule governance

Business rules must be versioned, testable, tenant-aware, and separated from UI copy. Calculated outcomes retain the rule version and input timestamps that produced them. Missing evidence must produce `unknown` or reduced confidence, not a fabricated value.

## Phase 0 inventory recovery concepts

- **On-hand quantity:** the trusted ledger or imported quantity attributable to a tenant and location at a recorded time.
- **Inventory value:** quantity multiplied by an approved cost basis and currency context; never mix currencies without an explicit rate and timestamp.
- **Age:** elapsed time from the best approved receipt/availability evidence. Unknown dates remain unknown.
- **Sales velocity:** eligible units sold over a stated window, excluding voided or otherwise disallowed transactions.
- **Sell-through:** eligible units sold divided by eligible units available for the stated cohort and window; denominator rules must be explicit.
- **Recovery opportunity:** an explainable classification indicating that stock value may benefit from an authorized action. It is not an automatic markdown instruction.

## Classification safeguards

- Thresholds are organization-configurable only through authorized settings when that capability is activated.
- Returns, transfers, damaged stock, consignment, and stock-count corrections require explicit treatment.
- Data freshness and coverage must accompany each classification.
- A SKU may be suppressed when inputs conflict, provenance is missing, or confidence falls below the approved threshold.
- Recommendations cannot change prices, publish promotions, move stock, or contact customers without separate authorization and confirmation.

## Open decisions

The Phase 0 v1 rule pack below was approved by the product owner on 2026-07-05. Any change requires a new version and recalculation; historical decisions retain the version used.

## Approved Phase 0 v1 rule pack

- **Inventory age:** `fresh` is 0–60 elapsed days, `watch` is 61–90, `aged` is 91–180, and `dead` is over 180. Missing approved receipt/availability evidence remains `unknown` and cannot be treated as day zero.
- **Sales analysis:** trailing 90 eligible days with a trailing 30-day recent comparison. Voided/refunded activity is excluded from eligible sales; absent coverage is disclosed.
- **Cost basis:** use the latest approved unit cost carried by the canonical SKU/inventory record. Missing cost suppresses inventory-value and recoverable-value outputs rather than substituting zero.
- **Data Confidence:** `40% completeness + 30% freshness + 30% consistency`, with every component retained. Results below 60 are suppressed from recovery recommendation and routed to data remediation.
- **Currency:** Phase 0 performs no foreign-exchange conversion. Aggregate monetary values only when every input uses the organization's approved base currency; otherwise show separated values or `unknown`.
- **Recovery actions:** investigate, data remediation, bundle/capsule proposal, markdown proposal, campaign repositioning proposal, and store-transfer proposal. They are recommendations/drafts only and never execute stock, price, publishing, or customer-contact changes.
- **Approvals:** ORG_OWNER and delegated EXECUTIVE may approve. MERCHANDISING_MANAGER may upload, consolidate, analyze, and draft but not self-approve. STORE_MANAGER is limited to assigned-location context and tasks. VIEWER is read-only.
- **File formats:** bounded CSV is required first. Excel remains conditional on passing the hostile-workbook security gate.

Rule version identifier: `phase0-v1`.
