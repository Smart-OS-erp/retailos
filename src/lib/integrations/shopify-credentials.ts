import "server-only";

import type {
  ShopifyCredentialResolver,
  ShopifyCredentials,
  ShopifySyncEnvelope,
} from "@/lib/integrations/shopify-worker";

const DEFAULT_SHOPIFY_API_VERSION = "2026-07";

type CredentialEnvelope = {
  dataSources?: Record<string, Partial<ShopifyCredentials>>;
  sourceKeys?: Record<string, Partial<ShopifyCredentials>>;
};

function normalizeShopDomain(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
      return new URL(trimmed).hostname.toLowerCase();
    }
  } catch {
    return null;
  }

  return trimmed.toLowerCase();
}

function isSafeShopDomain(value: string) {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(value);
}

function coerceCredentials(
  candidate: Partial<ShopifyCredentials> | undefined,
) {
  if (!candidate?.shopDomain || !candidate.adminAccessToken) return null;

  const shopDomain = normalizeShopDomain(candidate.shopDomain);
  if (!shopDomain || !isSafeShopDomain(shopDomain)) return null;

  const adminAccessToken = candidate.adminAccessToken.trim();
  if (adminAccessToken.length < 12) return null;

  const apiVersion = candidate.apiVersion?.trim() || DEFAULT_SHOPIFY_API_VERSION;
  if (!/^\d{4}-\d{2}$/.test(apiVersion)) return null;

  return {
    shopDomain,
    adminAccessToken,
    apiVersion,
  } satisfies ShopifyCredentials;
}

export class EnvShopifyCredentialResolver implements ShopifyCredentialResolver {
  async resolve(envelope: ShopifySyncEnvelope) {
    const raw = process.env.SHOPIFY_CONNECTOR_CREDENTIALS_JSON;
    if (!raw) return null;

    let parsed: CredentialEnvelope;
    try {
      parsed = JSON.parse(raw) as CredentialEnvelope;
    } catch {
      return null;
    }

    return coerceCredentials(parsed.dataSources?.[envelope.dataSourceId])
      ?? coerceCredentials(parsed.sourceKeys?.[envelope.sourceKey])
      ?? null;
  }
}
