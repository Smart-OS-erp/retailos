# Aso Collective Demo Script

Dataset version: `ASO_PHASE0_DATASET_V1`

## Intended walkthrough

1. Introduce Aso Collective as a Nigerian fashion retailer with four physical stores and one ecommerce inventory pool.
2. Show that the dataset contains POS, spreadsheet, WooCommerce-style, transfer, adjustment, sales, and product-master source records.
3. Explain that all records are synthetic and pinned to the reference date `2026-07-31`.
4. Run `npm run demo:verify` to prove the committed expected-results fixtures match independently calculated deterministic formulas.
5. Walk through messy-data examples:
   - invalid location is rejected;
   - missing cost requires caution;
   - low-confidence identity match requires review;
   - corrected record can be approved;
   - alias mapping can be reused.
6. Walk through retail examples:
   - Lagos overstock with Abuja demand;
   - Abuja overstock with ecommerce demand;
   - aged inventory over 26 weeks;
   - new product protected from dead-stock classification;
   - markdown candidate;
   - transfer-first candidate;
   - campaign candidate;
   - hold-and-monitor recommendation.
7. Explain value terminology:
   - Value Identified is not recovered value;
   - Value Projectised is approved into a recovery project;
   - Expected Recovery is pre-execution estimate;
   - Actual Recovery requires measured outcome after action.
8. Reiterate that Phase 0 never auto-executes stock movement, markdowns, finance actions, or external-system write-back.

## Operator notes

- Do not use real retailer data.
- Do not paste secrets into demo commands.
- Do not claim original consultant approval.
- Do not claim production Phase 0 acceptance until M0.21 evidence exists.
