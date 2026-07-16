import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { runProviderSyncAfterEnqueue } from "@/lib/integrations/provider-sync";
import { recordsFromProduct } from "@/lib/integrations/shopify-client";
import {
  runShopifyMvpSyncJob,
  type ShopifyCredentialResolver,
  type ShopifyExternalRecord,
  type ShopifyProviderClient,
  type ShopifySyncEnvelope,
  type ShopifySyncStore,
} from "@/lib/integrations/shopify-worker";

const envelope = {
  jobId: "30000000-0000-4000-8000-000000000001",
  organizationId: "10000000-0000-4000-8000-000000000001",
  dataSourceId: "20000000-0000-4000-8000-000000000001",
  providerKey: "shopify",
  sourceKey: "lagos-shopify",
  connectorDepth: "mvp",
  dataSourceStatus: "syncing",
  credentialStatus: "configured",
  syncJobStatus: "queued",
} satisfies ShopifySyncEnvelope;

const credentials = {
  shopDomain: "retailos-test.myshopify.com",
  adminAccessToken: "test-admin-token",
  apiVersion: "2026-07",
};

const sampleRecords = [
  {
    recordType: "product_master",
    sourceRecordKey: "shopify:product:1:variant:1",
    sourceUpdatedAt: "2026-07-16T08:00:00Z",
    payload: {
      sku: "SKU-001",
      product_name: "Women Blazer",
    },
  },
] satisfies ShopifyExternalRecord[];

class FakeStore implements ShopifySyncStore {
  failedCodes: string[] = [];
  runningJobs: string[] = [];
  upsertedRecords: ShopifyExternalRecord[] = [];

  constructor(private readonly currentEnvelope: ShopifySyncEnvelope | null) {}

  async getEnvelope() {
    return this.currentEnvelope;
  }

  async markRunning(jobId: string) {
    this.runningJobs.push(jobId);
  }

  async upsertExternalRecords(
    _envelope: ShopifySyncEnvelope,
    records: ShopifyExternalRecord[],
  ) {
    this.upsertedRecords.push(...records);
    return records.length;
  }

  async markFailed(
    _envelope: Pick<ShopifySyncEnvelope, "jobId" | "organizationId" | "dataSourceId">,
    error: { code: string },
  ) {
    this.failedCodes.push(error.code);
  }
}

const configuredCredentials: ShopifyCredentialResolver = {
  async resolve() {
    return credentials;
  },
};

const missingCredentials: ShopifyCredentialResolver = {
  async resolve() {
    return null;
  },
};

function clientReturning(records: ShopifyExternalRecord[]): ShopifyProviderClient {
  return {
    async fetchRecords() {
      return records;
    },
  };
}

describe("Shopify Phase 0.5 MVP worker", () => {
  it("fails closed when a configured source has no server-side credential material", async () => {
    const store = new FakeStore(envelope);
    const client = {
      fetchRecords: vi.fn(async () => sampleRecords),
    };

    const result = await runShopifyMvpSyncJob(envelope.jobId, {
      store,
      credentials: missingCredentials,
      client,
      expectedOrganizationId: envelope.organizationId,
    });

    expect(result).toMatchObject({
      status: "failed",
      errorCode: "credentials.unavailable",
      shouldNormalize: false,
    });
    expect(client.fetchRecords).not.toHaveBeenCalled();
    expect(store.failedCodes).toEqual(["credentials.unavailable"]);
  });

  it("persists raw Shopify records before normalization handoff", async () => {
    const store = new FakeStore(envelope);

    const result = await runShopifyMvpSyncJob(envelope.jobId, {
      store,
      credentials: configuredCredentials,
      client: clientReturning(sampleRecords),
      expectedOrganizationId: envelope.organizationId,
    });

    expect(result).toMatchObject({
      status: "raw-records-ready",
      externalRecords: 1,
      shouldNormalize: true,
    });
    expect(store.runningJobs).toEqual([envelope.jobId]);
    expect(store.upsertedRecords).toEqual(sampleRecords);
  });

  it("normalizes through the existing handoff only after raw records are ready", async () => {
    const store = new FakeStore(envelope);
    const normalizeExternalRecords = vi.fn(async () => ({ error: null }));

    const result = await runProviderSyncAfterEnqueue(
      {
        jobId: envelope.jobId,
        organizationId: envelope.organizationId,
        normalizeExternalRecords,
      },
      {
        store,
        credentials: configuredCredentials,
        client: clientReturning(sampleRecords),
      },
    );

    expect(result).toMatchObject({
      status: "normalized",
      externalRecords: 1,
    });
    expect(normalizeExternalRecords).toHaveBeenCalledWith(envelope.jobId);
  });

  it("maps Shopify products to product master and inventory snapshot records", () => {
    const records = recordsFromProduct({
      id: "gid://shopify/Product/1",
      title: "Women Blazer",
      vendor: "Adaa",
      productType: "Outerwear",
      updatedAt: "2026-07-16T08:00:00Z",
      variants: {
        nodes: [
          {
            id: "gid://shopify/ProductVariant/2",
            sku: "SKU-001",
            title: "Blue / M",
            updatedAt: "2026-07-16T08:05:00Z",
            inventoryItem: {
              id: "gid://shopify/InventoryItem/3",
              inventoryLevels: {
                nodes: [
                  {
                    id: "gid://shopify/InventoryLevel/4",
                    location: {
                      id: "gid://shopify/Location/5",
                      name: "Lekki Flagship",
                    },
                    quantities: [{ name: "available", quantity: 12 }],
                  },
                ],
              },
            },
          },
        ],
      },
    });

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      recordType: "product_master",
      payload: {
        provider: "shopify",
        sku: "SKU-001",
        product_name: "Women Blazer",
      },
    });
    expect(records[1]).toMatchObject({
      recordType: "inventory_snapshot",
      payload: {
        location_code: "lekki-flagship",
        quantity: 12,
      },
    });
  });
});
