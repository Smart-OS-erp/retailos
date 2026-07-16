export type TenantMarketConfig = Readonly<{
  country: string;
  countryCode: string;
  currency: string;
  locale: string;
  timeZone: string;
}>;

export type TenantMarketOverrides = Partial<TenantMarketConfig>;

export const RETAILOS_DEFAULT_MARKET: TenantMarketConfig = {
  country: "Nigeria",
  countryCode: "NG",
  currency: "NGN",
  locale: "en-NG",
  timeZone: "Africa/Lagos",
};

export function resolveTenantMarketConfig(
  overrides: TenantMarketOverrides = {},
): TenantMarketConfig {
  return {
    country: overrides.country ?? RETAILOS_DEFAULT_MARKET.country,
    countryCode: overrides.countryCode ?? RETAILOS_DEFAULT_MARKET.countryCode,
    currency: overrides.currency ?? RETAILOS_DEFAULT_MARKET.currency,
    locale: overrides.locale ?? RETAILOS_DEFAULT_MARKET.locale,
    timeZone: overrides.timeZone ?? RETAILOS_DEFAULT_MARKET.timeZone,
  };
}

export function formatRetailCurrency(
  value: number,
  overrides: TenantMarketOverrides = {},
) {
  const market = resolveTenantMarketConfig(overrides);

  return new Intl.NumberFormat(market.locale, {
    currency: market.currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatRetailDate(
  value: Date | string,
  overrides: TenantMarketOverrides = {},
) {
  const market = resolveTenantMarketConfig(overrides);

  return new Intl.DateTimeFormat(market.locale, {
    dateStyle: "medium",
    timeZone: market.timeZone,
  }).format(new Date(value));
}

export function formatRetailDateTime(
  value: Date | string,
  overrides: TenantMarketOverrides = {},
) {
  const market = resolveTenantMarketConfig(overrides);

  return new Intl.DateTimeFormat(market.locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: market.timeZone,
  }).format(new Date(value));
}
