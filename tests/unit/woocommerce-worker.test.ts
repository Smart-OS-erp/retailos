import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { runProviderSyncAfterEnqueue } from "@/lib/integrations/provider-sync";
import { recordsFromWooCommerceProduct } from "@/lib/integrations/woocommerce-client";
import {
  runWooCommerceMvpSyncJob,
} from "@/lib/integrations/woocommerce-worker";
import type {
  ShopifyExternalRecord,
  ShopifySyncEnvelope,
  ShopifySyncStore,
} from "@/lib/integrations/shopify-worker";
import type {
  WooCommerceCredentialResolver,
  WooCommerceCredentials,
} from "@/lib/integrations/woocommerce-credentials";
import type {
  WooCommerceProviderClient,
} from "@/lib/integrations/woocommerce-client";

const envelope = {
  jobId: "30000000-0000-4000-8000-000000000002",
  organizationId: "10000000-0000-4000-8000-000000000001",
  dataSourceId: "20000000-0000-4000-8000-000000000002",
  providerKey: "woocommerce",
  sourceKey: "lagos-woocommerce",
  connectorDepth: "mvp",
  dataSourceStatus: "syncing",
  credentialStatus: "configured",
  syncJobStatus: "queued",
} satisfies ShopifySyncEnvelope;

const credentials = {
  apiVersion: "wc/v3",
  consumerKey: "ck_testconsumerkey",
  consumerSecret: "cs_testconsumersecret",
  siteUrl: "https://store.example.com",
} satisfies WooCommerceCredentials;

const sampleRecords = [
  {
    recordType: "product_master",
    sourceRecordKey: "woocommerce:product:12:master",
    sourceUpdatedAt: "2026-07-16T08:00:00.000Z",
    payload: {
      provider: "woocommerce",
      sku: "WOO-001",
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
    _envelope: Pick<
      ShopifySyncEnvelope,
      "jobId" | "organizationId" | "dataSourceId"
    >,
    error: { code: string },
  ) {
    this.failedCodes.push(error.code);
  }
}

const configuredCredentials: WooCommerceCredentialResolver = {
  async resolve() {
    return credentials;
  },
};

const missingCredentials: WooCommerceCredentialResolver = {
  async resolve() {
    return null;
  },
};

function clientReturning(
  records: ShopifyExternalRecord[],
): WooCommerceProviderClient {
  return {
    async fetchRecords() {
      return records;
    },
  };
}

describe("WooCommerce Phase 0.5 MVP worker", () => {
  it("fails closed when a configured source has no server-side credential material", async () => {
    const store = new FakeStore(envelope);
    const client = {
      fetchRecords: vi.fn(async () => sampleRecords),
    };

    const result = await runWooCommerceMvpSyncJob(envelope.jobId, {
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

  it("persists raw WooCommerce records before normalization handoff", async () => {
    const store = new FakeStore(envelope);

    const result = await runWooCommerceMvpSyncJob(envelope.jobId, {
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

  it("routes WooCommerce queued jobs through the provider handoff", async () => {
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
        wooCommerceCredentials: configuredCredentials,
        wooCommerceClient: clientReturning(sampleRecords),
      },
    );

    expect(result).toMatchObject({
      status: "normalized",
      externalRecords: 1,
    });
    expect(normalizeExternalRecords).toHaveBeenCalledWith(envelope.jobId);
  });

  it("maps WooCommerce products to product master and inventory snapshot records", () => {
    const records = recordsFromWooCommerceProduct({
      id: 12,
      name: "Women Blazer",
      sku: "WOO-001",
      type: "simple",
      status: "publish",
      date_modified_gmt: "2026-07-16T08:00:00",
      price: "45000",
      regular_price: "50000",
      stock_quantity: 8,
      stock_status: "instock",
      categories: [{ name: "Women" }],
      brands: [{ name: "Adaa" }],
    });

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      recordType: "product_master",
      payload: {
        provider: "woocommerce",
        sku: "WOO-001",
        product_name: "Women Blazer",
        category: "Women",
        brand: "Adaa",
      },
    });
    expect(records[1]).toMatchObject({
      recordType: "inventory_snapshot",
      payload: {
        location_code: "woocommerce-online",
        quantity: 8,
      },
    });
  });
});
