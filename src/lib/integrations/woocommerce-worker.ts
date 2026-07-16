import "server-only";

import {
  ProviderSyncError,
  type ShopifyExternalRecord,
  type ShopifySyncResult,
  type ShopifySyncStore,
  toProviderSyncError,
} from "@/lib/integrations/shopify-worker";
import type { WooCommerceProviderClient } from "@/lib/integrations/woocommerce-client";
import type { WooCommerceCredentialResolver } from "@/lib/integrations/woocommerce-credentials";

const MAX_PROVIDER_ATTEMPTS = 3;

export async function runWooCommerceMvpSyncJob(
  jobId: string,
  dependencies: {
    store: ShopifySyncStore;
    credentials: WooCommerceCredentialResolver;
    client: WooCommerceProviderClient;
    expectedOrganizationId?: string;
  },
): Promise<ShopifySyncResult> {
  const envelope = await dependencies.store.getEnvelope(jobId);

  if (!envelope) {
    return {
      status: "skipped",
      reason: "job-not-found",
      jobId,
      shouldNormalize: false,
    };
  }

  if (
    dependencies.expectedOrganizationId
    && envelope.organizationId !== dependencies.expectedOrganizationId
  ) {
    return {
      status: "skipped",
      reason: "organization-mismatch",
      jobId,
      shouldNormalize: false,
    };
  }

  if (envelope.providerKey !== "woocommerce") {
    return {
      status: "skipped",
      reason: "not-shopify",
      jobId,
      shouldNormalize: false,
    };
  }

  if (envelope.syncJobStatus !== "queued") {
    return {
      status: "skipped",
      reason: "job-not-queued",
      jobId,
      shouldNormalize: false,
    };
  }

  if (envelope.connectorDepth !== "mvp") {
    const error = new ProviderSyncError(
      "connector.not_mvp",
      "WooCommerce sync requires an MVP connector data source.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return failed(jobId, error);
  }

  if (envelope.dataSourceStatus === "disabled" || envelope.dataSourceStatus === "paused") {
    const error = new ProviderSyncError(
      "data_source.not_syncable",
      "WooCommerce data source is not syncable.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return failed(jobId, error);
  }

  if (envelope.credentialStatus !== "configured") {
    const error = new ProviderSyncError(
      "credentials.missing",
      "WooCommerce connector credentials are not configured for this data source.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return failed(jobId, error);
  }

  const credentials = await dependencies.credentials.resolve(envelope);
  if (!credentials) {
    const error = new ProviderSyncError(
      "credentials.unavailable",
      "WooCommerce connector credentials are marked configured but are unavailable to the server worker.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return failed(jobId, error);
  }

  await dependencies.store.markRunning(jobId);

  let records: ShopifyExternalRecord[] = [];
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
    try {
      records = await dependencies.client.fetchRecords(credentials);
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      const syncError = toProviderSyncError(error);
      if (!syncError.retryable || attempt === MAX_PROVIDER_ATTEMPTS) {
        break;
      }
    }
  }

  if (lastError) {
    const syncError = toProviderSyncError(lastError);
    await dependencies.store.markFailed(envelope, syncError);
    return failed(jobId, syncError);
  }

  if (records.length === 0) {
    const error = new ProviderSyncError(
      "provider.empty_response",
      "WooCommerce returned no product or inventory records to ingest.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return failed(jobId, error);
  }

  const externalRecords = await dependencies.store.upsertExternalRecords(
    envelope,
    records,
  );

  return {
    status: "raw-records-ready",
    jobId,
    externalRecords,
    shouldNormalize: true,
  };
}

function failed(jobId: string, error: ProviderSyncError): ShopifySyncResult {
  return {
    status: "failed",
    jobId,
    errorCode: error.code,
    shouldNormalize: false,
  };
}
