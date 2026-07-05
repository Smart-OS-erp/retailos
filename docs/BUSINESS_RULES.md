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

Exact age bands, analysis windows, cost basis, confidence formula, currency conversion source, and recommended-action catalogue require product-owner approval before implementation.
