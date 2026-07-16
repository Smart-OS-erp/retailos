import "server-only";

import {
  ProviderSyncError,
  type ShopifyExternalRecord,
} from "@/lib/integrations/shopify-worker";
import type { WooCommerceCredentials } from "@/lib/integrations/woocommerce-credentials";

// RLS_SCOPED_REVIEWED: this provider client does not query Supabase; tenant
// scope is enforced by the provider sync store before/after external access.
type WooCommerceProduct = {
  id: number;
  name?: string | null;
  sku?: string | null;
  type?: string | null;
  status?: string | null;
  date_modified_gmt?: string | null;
  price?: string | null;
  regular_price?: string | null;
  sale_price?: string | null;
  stock_quantity?: number | null;
  stock_status?: string | null;
  categories?: Array<{ id?: number; name?: string | null }> | null;
  brands?: Array<{ id?: number; name?: string | null }> | null;
  images?: Array<{ id?: number; src?: string | null }> | null;
};

export type WooCommerceProviderClient = {
  fetchRecords(credentials: WooCommerceCredentials): Promise<ShopifyExternalRecord[]>;
};

const MAX_PRODUCTS_PER_PULL = 100;

export class WooCommerceRestClient implements WooCommerceProviderClient {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async fetchRecords(credentials: WooCommerceCredentials) {
    const endpoint = new URL(
      `/wp-json/${credentials.apiVersion}/products`,
      credentials.siteUrl,
    );
    endpoint.searchParams.set("per_page", String(MAX_PRODUCTS_PER_PULL));
    endpoint.searchParams.set("status", "any");
    endpoint.searchParams.set("orderby", "modified");
    endpoint.searchParams.set("order", "desc");

    const response = await this.fetcher(endpoint, {
      headers: {
        authorization: `Basic ${Buffer.from(
          `${credentials.consumerKey}:${credentials.consumerSecret}`,
        ).toString("base64")}`,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new ProviderSyncError(
        response.status === 401 || response.status === 403
          ? "provider.authentication_failed"
          : "provider.http_error",
        "WooCommerce REST API request was rejected.",
        response.status === 429 || response.status >= 500,
      );
    }

    const body = await response.json() as unknown;
    if (!Array.isArray(body)) {
      throw new ProviderSyncError(
        "provider.invalid_response",
        "WooCommerce REST API returned an unexpected product response.",
        false,
      );
    }

    return body.flatMap((product) =>
      recordsFromWooCommerceProduct(product as WooCommerceProduct),
    );
  }
}

export function recordsFromWooCommerceProduct(product: WooCommerceProduct) {
  const sku = normalizedSku(product);
  const updatedAt = sourceUpdatedAt(product.date_modified_gmt);
  const productName = product.name?.trim() || sku;
  const category = firstNamed(product.categories);
  const brand = firstNamed(product.brands);
  const records: ShopifyExternalRecord[] = [
    {
      recordType: "product_master",
      sourceRecordKey: `woocommerce:product:${product.id}:master`,
      sourceUpdatedAt: updatedAt,
      payload: {
        provider: "woocommerce",
        product_id: product.id,
        sku,
        product_name: productName,
        product_type: product.type ?? null,
        status: product.status ?? null,
        category,
        brand,
        price: product.price ?? null,
        regular_price: product.regular_price ?? null,
        sale_price: product.sale_price ?? null,
        image_url: product.images?.[0]?.src ?? null,
      },
    },
  ];

  if (
    typeof product.stock_quantity === "number"
    && Number.isFinite(product.stock_quantity)
    && product.stock_quantity >= 0
  ) {
    records.push({
      recordType: "inventory_snapshot",
      sourceRecordKey: `woocommerce:product:${product.id}:inventory:online`,
      sourceUpdatedAt: updatedAt,
      payload: {
        provider: "woocommerce",
        product_id: product.id,
        sku,
        product_name: productName,
        location_code: "woocommerce-online",
        location_name: "WooCommerce Online",
        quantity: Math.trunc(product.stock_quantity),
        stock_status: product.stock_status ?? null,
      },
    });
  }

  return records;
}

function normalizedSku(product: WooCommerceProduct) {
  return product.sku?.trim() || `woocommerce-product-${product.id}`;
}

function sourceUpdatedAt(value: string | null | undefined) {
  if (!value) return null;
  const candidate = value.endsWith("Z") ? value : `${value}Z`;
  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function firstNamed(items: Array<{ name?: string | null }> | null | undefined) {
  return items?.find((item) => item.name?.trim())?.name?.trim() ?? null;
}
