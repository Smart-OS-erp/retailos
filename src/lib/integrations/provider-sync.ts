import "server-only";

import { EnvShopifyCredentialResolver } from "@/lib/integrations/shopify-credentials";
import { ShopifyAdminGraphqlClient } from "@/lib/integrations/shopify-client";
import { PostgresProviderSyncStore } from "@/lib/integrations/postgres-sync-store";
import {
  ProviderSyncError,
  runShopifyMvpSyncJob,
  type ShopifyCredentialResolver,
  type ShopifyProviderClient,
  type ShopifySyncStore,
} from "@/lib/integrations/shopify-worker";

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
  },
) {
  const store = dependencies?.store ?? new PostgresProviderSyncStore();
  const result = await runShopifyMvpSyncJob(input.jobId, {
    store,
    credentials: dependencies?.credentials ?? new EnvShopifyCredentialResolver(),
    client: dependencies?.client ?? new ShopifyAdminGraphqlClient(),
    expectedOrganizationId: input.organizationId,
  });

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
