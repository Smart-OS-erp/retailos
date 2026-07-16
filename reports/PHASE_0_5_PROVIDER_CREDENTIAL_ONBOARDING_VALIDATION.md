# Phase 0.5 Provider Credential Onboarding Validation

## Scope

This milestone adds a narrow server-side credential availability check for Shopify MVP data sources.

It does not add OAuth, browser credential entry, WooCommerce credentials, Google Sheets credentials, scheduled sync, or new provider workers.

## Implemented

- `verifyProviderCredentials` server action for Integration Hub and onboarding data-source pages.
- `verifyProviderCredentialAvailability` server-only helper.
- Shopify credential availability is resolved through the existing `EnvShopifyCredentialResolver`.
- Missing credentials fail closed and keep the source in `configuration_required` with `credential_status = 'missing'`.
- Available server-side Shopify credential material marks the source `connected` with `credential_status = 'configured'`.
- Safe metadata written to `connection_metadata` includes provider key, credential method, and verification timestamp only; no token or provider secret is stored.
- Integration Hub displays safe success/failure notices and a `Verify server credentials` action for eligible Shopify MVP sources.

## Not Implemented

- No browser form for secret entry.
- No OAuth.
- No new provider credential storage table.
- No WooCommerce or Google Sheets credential verifier.
- No scheduled sync worker.
- No canonical product/location/sales write approval flow.
- No automatic intelligence recalculation.

## Security Notes

- Provider credentials remain server-only.
- The action re-checks organization context, membership, RBAC, data-source ID format, tenant ownership, provider lookup, provider key, and connector depth on the server.
- Unsupported providers and non-MVP connectors fail closed.
- The UI never renders provider secret names or values.
- This milestone does not add API routes.

## Validation Commands

Completed locally on July 16, 2026:

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test` — passed, 23 files and 108 tests.
- `npm run security` — passed.
- `npm run build` — passed.

Environment note: local npm still emits the known engine warning because this shell uses Node 26 while the project and Vercel target Node 22. Vercel project runtime remains aligned to `22.x` from M0-R.

## Acceptance Boundary

This milestone verifies whether reviewed server-side Shopify credential material is available for a source. It does not prove the Shopify Admin API token is live against Shopify until an actual sync is requested and the server-only worker runs.
