import "server-only";

import {
  ProviderSyncError,
  type ShopifyCredentials,
  type ShopifyExternalRecord,
  type ShopifyProviderClient,
} from "@/lib/integrations/shopify-worker";

type ShopifyGraphqlResponse = {
  data?: {
    products?: {
      nodes?: ShopifyProductNode[];
      pageInfo?: {
        hasNextPage?: boolean;
        endCursor?: string | null;
      };
    };
  };
  errors?: Array<{ message?: string }>;
};

type ShopifyProductNode = {
  id: string;
  title?: string | null;
  handle?: string | null;
  vendor?: string | null;
  productType?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  variants?: {
    nodes?: ShopifyVariantNode[];
  };
};

type ShopifyVariantNode = {
  id: string;
  sku?: string | null;
  title?: string | null;
  barcode?: string | null;
  price?: string | null;
  compareAtPrice?: string | null;
  updatedAt?: string | null;
  inventoryItem?: {
    id: string;
    inventoryLevels?: {
      nodes?: ShopifyInventoryLevelNode[];
    };
  } | null;
};

type ShopifyInventoryLevelNode = {
  id: string;
  updatedAt?: string | null;
  location?: {
    id: string;
    name?: string | null;
  } | null;
  quantities?: Array<{
    name?: string | null;
    quantity?: number | null;
  }> | null;
};

const PRODUCTS_QUERY = `
  query RetailOSProductInventory($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        vendor
        productType
        status
        updatedAt
        variants(first: 100) {
          nodes {
            id
            sku
            title
            barcode
            price
            compareAtPrice
            updatedAt
            inventoryItem {
              id
              inventoryLevels(first: 20) {
                nodes {
                  id
                  updatedAt
                  location {
                    id
                    name
                  }
                  quantities(names: ["available"])
                }
              }
            }
          }
        }
      }
    }
  }
`;

const MAX_PRODUCT_PAGES = 5;

export class ShopifyAdminGraphqlClient implements ShopifyProviderClient {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async fetchRecords(credentials: ShopifyCredentials) {
    const records: ShopifyExternalRecord[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < MAX_PRODUCT_PAGES; page += 1) {
      const response = await this.graphql(credentials, { cursor });
      const products = response.data?.products?.nodes ?? [];

      for (const product of products) {
        records.push(...recordsFromProduct(product));
      }

      const pageInfo = response.data?.products?.pageInfo;
      if (!pageInfo?.hasNextPage) break;
      cursor = pageInfo.endCursor ?? null;
      if (!cursor) break;
    }

    return records;
  }

  private async graphql(
    credentials: ShopifyCredentials,
    variables: Record<string, string | null>,
  ) {
    const response = await this.fetcher(
      `https://${credentials.shopDomain}/admin/api/${credentials.apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-shopify-access-token": credentials.adminAccessToken,
        },
        body: JSON.stringify({
          query: PRODUCTS_QUERY,
          variables,
        }),
      },
    );

    if (!response.ok) {
      throw new ProviderSyncError(
        response.status === 401 || response.status === 403
          ? "provider.authentication_failed"
          : "provider.http_error",
        "Shopify Admin API request was rejected.",
        response.status === 429 || response.status >= 500,
      );
    }

    const body = await response.json() as ShopifyGraphqlResponse;
    if (body.errors?.length) {
      throw new ProviderSyncError(
        "provider.graphql_error",
        "Shopify Admin API returned GraphQL errors.",
        false,
      );
    }

    return body;
  }
}

export function recordsFromProduct(product: ShopifyProductNode) {
  const records: ShopifyExternalRecord[] = [];
  const variants = product.variants?.nodes ?? [];

  for (const variant of variants) {
    const sku = normalizedSku(variant);
    records.push({
      recordType: "product_master",
      sourceRecordKey: `shopify:${product.id}:variant:${variant.id}`,
      sourceUpdatedAt: variant.updatedAt ?? product.updatedAt ?? null,
      payload: {
        provider: "shopify",
        product_id: product.id,
        variant_id: variant.id,
        sku,
        product_name: product.title ?? sku,
        variant_title: variant.title ?? null,
        brand: product.vendor ?? null,
        category: product.productType ?? null,
        handle: product.handle ?? null,
        status: product.status ?? null,
        barcode: variant.barcode ?? null,
        price: variant.price ?? null,
        compare_at_price: variant.compareAtPrice ?? null,
      },
    });

    const inventoryLevels = variant.inventoryItem?.inventoryLevels?.nodes ?? [];
    for (const level of inventoryLevels) {
      const available = availableQuantity(level);
      if (available === null) continue;

      records.push({
        recordType: "inventory_snapshot",
        sourceRecordKey: `shopify:${variant.inventoryItem?.id ?? variant.id}:location:${level.location?.id ?? level.id}`,
        sourceUpdatedAt: level.updatedAt ?? variant.updatedAt ?? product.updatedAt ?? null,
        payload: {
          provider: "shopify",
          product_id: product.id,
          variant_id: variant.id,
          inventory_item_id: variant.inventoryItem?.id ?? null,
          inventory_level_id: level.id,
          shopify_location_id: level.location?.id ?? null,
          location_name: level.location?.name ?? null,
          location_code: locationCode(level.location),
          sku,
          product_name: product.title ?? sku,
          quantity: available,
          available,
        },
      });
    }
  }

  return records;
}

function normalizedSku(variant: ShopifyVariantNode) {
  return variant.sku?.trim() || variant.id;
}

function availableQuantity(level: ShopifyInventoryLevelNode) {
  const quantity = level.quantities?.find((item) => item.name === "available")
    ?.quantity;

  return typeof quantity === "number"
    && Number.isInteger(quantity)
    && quantity >= 0
    ? quantity
    : null;
}

function locationCode(location: ShopifyInventoryLevelNode["location"]) {
  const candidate = location?.name?.trim() || location?.id || "shopify-location";
  const normalized = candidate
    .toLowerCase()
    .replace(/^gid:\/\/shopify\/location\//, "shopify-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "shopify-location";
}
