import "server-only";

import type {
  ShopifyCredentialResolver,
  ShopifySyncEnvelope,
} from "@/lib/integrations/shopify-worker";

export type WooCommerceCredentials = {
  apiVersion: string;
  consumerKey: string;
  consumerSecret: string;
  siteUrl: string;
};

export type WooCommerceCredentialResolver = {
  resolve(envelope: ShopifySyncEnvelope): Promise<WooCommerceCredentials | null>;
};

const DEFAULT_WOOCOMMERCE_API_VERSION = "wc/v3";

type CredentialEnvelope = {
  dataSources?: Record<string, Partial<WooCommerceCredentials>>;
  sourceKeys?: Record<string, Partial<WooCommerceCredentials>>;
};

function normalizeSiteUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function coerceCredentials(
  candidate: Partial<WooCommerceCredentials> | undefined,
) {
  if (!candidate?.siteUrl || !candidate.consumerKey || !candidate.consumerSecret) {
    return null;
  }

  const siteUrl = normalizeSiteUrl(candidate.siteUrl);
  if (!siteUrl) return null;

  const consumerKey = candidate.consumerKey.trim();
  const consumerSecret = candidate.consumerSecret.trim();
  if (!/^ck_[A-Za-z0-9]{10,}$/.test(consumerKey)) return null;
  if (!/^cs_[A-Za-z0-9]{10,}$/.test(consumerSecret)) return null;

  const apiVersion =
    candidate.apiVersion?.trim() || DEFAULT_WOOCOMMERCE_API_VERSION;
  if (!/^wc\/v\d+$/.test(apiVersion)) return null;

  return {
    apiVersion,
    consumerKey,
    consumerSecret,
    siteUrl,
  } satisfies WooCommerceCredentials;
}

export class EnvWooCommerceCredentialResolver
implements WooCommerceCredentialResolver {
  async resolve(envelope: ShopifySyncEnvelope) {
    const raw = process.env.WOOCOMMERCE_CONNECTOR_CREDENTIALS_JSON;
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

/**
 * Structural compatibility helper for the shared credential verification
 * harness. WooCommerce and Shopify resolvers deliberately share the same
 * envelope shape, but they do not share secret names or secret formats.
 */
export type WooCommerceVerifierResolver = ShopifyCredentialResolver;
