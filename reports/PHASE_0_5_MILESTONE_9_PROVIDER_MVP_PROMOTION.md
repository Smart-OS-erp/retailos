# Phase 0.5 Milestone 9 — Provider MVP Promotion

## Scope

Founder instruction approved moving scaffold-only Phase 0.5 providers to MVP where Phase 0.5 already allows either scaffold or MVP:

- Shopify
- WooCommerce
- Google Sheets

POS/ERP and custom backend remain scaffold/import-API paths. This milestone does not authorize POS, direct website scraping, finance, wholesale, warehouse management, forecasting, marketplace publishing, autonomous execution, or real LLM agent execution.

## Implemented

- Added migration `20260715152000_phase0_5_provider_mvp_promotion.sql`.
- Updated the provider catalogue contract so Shopify, WooCommerce, and Google Sheets default to `mvp`.
- Kept credential status as `missing` so provider sync fails closed until server-side credentials are configured.
- Updated Integration Hub copy to describe MVP-approved, credential-gated provider setup.
- Updated Integration Hub tests to verify MVP depth and safe credential-missing sync behavior.

## Security notes

- No provider secrets were added.
- No browser-facing secret fields were added.
- No provider API calls were added.
- No connector writes directly into canonical inventory, product, location, sales, intelligence, or projectisation tables.
- Import API remains the only verified live ingestion route until provider-specific workers are implemented.

## Remaining work

- Apply pending hosted Supabase migrations:
  - `20260715133000_phase0_5_pipeline_handoff.sql`
  - `20260715143000_phase0_5_record_type_mappings.sql`
  - `20260715152000_phase0_5_provider_mvp_promotion.sql`
- Build one provider-specific worker at a time with server-only credentials, retries, external-record writes, and normalization tests.
- Run hosted schema/RLS verification and Phase 0.5 acceptance smoke after migrations are applied.
