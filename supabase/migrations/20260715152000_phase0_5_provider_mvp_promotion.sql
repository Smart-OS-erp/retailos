update public.integration_providers
set
  default_connector_depth = 'mvp',
  default_credential_status = 'missing',
  supports_manual_sync = true,
  help_text = case provider_key
    when 'shopify' then
      'Shopify is approved for Phase 0.5 MVP setup. Configure server-side credentials before sync can ingest records.'
    when 'woocommerce' then
      'WooCommerce is approved for Phase 0.5 MVP setup. Configure server-side credentials before sync can ingest records.'
    when 'google_sheets' then
      'Google Sheets is approved for Phase 0.5 MVP setup. Configure server-side credentials before sync can ingest records.'
    else help_text
  end,
  updated_at = now()
where provider_key in ('shopify', 'woocommerce', 'google_sheets');

comment on table public.integration_providers is
  'Provider catalogue for Phase 0.5 Integration Hub. Shopify, WooCommerce, and Google Sheets are MVP-approved but remain credential-gated; this is not a marketplace.';
