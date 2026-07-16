import "server-only";

import { EnvShopifyCredentialResolver } from "@/lib/integrations/shopify-credentials";
import { ShopifyAdminGraphqlClient } from "@/lib/integrations/shopify-client";
import { PostgresProviderSyncStore } from "@/lib/integrations/postgres-sync-store";
import { WooCommerceRestClient } from "@/lib/integrations/woocommerce-client";
import { EnvWooCommerceCredentialResolver } from "@/lib/integrations/woocommerce-credentials";
import { runWooCommerceMvpSyncJob } from "@/lib/integrations/woocommerce-worker";
import {
  ProviderSyncError,
  runShopifyMvpSyncJob,
  type ShopifyCredentialResolver,
  type ShopifyProviderClient,
  type ShopifySyncStore,
} from "@/lib/integrations/shopify-worker";
import type {
  WooCommerceProviderClient,
} from "@/lib/integrations/woocommerce-client";
import type {
  WooCommerceCredentialResolver,
} from "@/lib/integrations/woocommerce-credentials";

type NormalizeResult = {
  error: {
    message?: string;
    code?: string;
  } | null;
};

export type ProviderSyncAfterEnqueueInput = {
  jobId: string;
  organizationId: string;
  normalizeExternalRecords: (jobId: string) => Promise<NormalizeResult>;
};

export async function runProviderSyncAfterEnqueue(
  input: ProviderSyncAfterEnqueueInput,
  dependencies?: {
    store?: ShopifySyncStore;
    credentials?: ShopifyCredentialResolver;
    client?: ShopifyProviderClient;
    wooCommerceCredentials?: WooCommerceCredentialResolver;
    wooCommerceClient?: WooCommerceProviderClient;
  },
) {
  const store = dependencies?.store ?? new PostgresProviderSyncStore();
  let result = await runShopifyMvpSyncJob(input.jobId, {
    store,
    credentials: dependencies?.credentials ?? new EnvShopifyCredentialResolver(),
    client: dependencies?.client ?? new ShopifyAdminGraphqlClient(),
    expectedOrganizationId: input.organizationId,
  });

  if (result.status === "skipped" && result.reason === "not-shopify") {
    result = await runWooCommerceMvpSyncJob(input.jobId, {
      store,
      credentials:
        dependencies?.wooCommerceCredentials
        ?? new EnvWooCommerceCredentialResolver(),
      client: dependencies?.wooCommerceClient ?? new WooCommerceRestClient(),
      expectedOrganizationId: input.organizationId,
    });
  }

  if (!result.shouldNormalize) return result;

  const normalization = await input.normalizeExternalRecords(result.jobId);
  if (!normalization.error) {
    return {
      ...result,
      status: "normalized" as const,
    };
  }

  await store.markFailed(
    {
      jobId: result.jobId,
      organizationId: input.organizationId,
      dataSourceId: (await store.getEnvelope(result.jobId))?.dataSourceId ?? "",
    },
    new ProviderSyncError(
      "normalization.failed",
      safeNormalizationMessage(normalization.error),
      false,
    ),
  );

  return {
    status: "failed" as const,
    jobId: result.jobId,
    errorCode: "normalization.failed",
    shouldNormalize: false as const,
  };
}

function safeNormalizationMessage(error: { message?: string; code?: string }) {
  const code = error.code ? `${error.code}: ` : "";
  const message = error.message || "External record normalization failed.";
  return `${code}${message}`.slice(0, 500);
}
