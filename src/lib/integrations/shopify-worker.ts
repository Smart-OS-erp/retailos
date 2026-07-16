import "server-only";

import type {
  DataSourceStatus,
  ExternalRecordStatus,
  IntegrationConnectorDepth,
  IntegrationCredentialStatus,
  Json,
  SyncJobStatus,
} from "@/types/database";

export type ShopifySyncEnvelope = {
  jobId: string;
  organizationId: string;
  dataSourceId: string;
  providerKey: string;
  sourceKey: string;
  connectorDepth: IntegrationConnectorDepth;
  dataSourceStatus: DataSourceStatus;
  credentialStatus: IntegrationCredentialStatus;
  syncJobStatus: SyncJobStatus;
};

export type ShopifyCredentials = {
  shopDomain: string;
  adminAccessToken: string;
  apiVersion: string;
};

export type ShopifyExternalRecord = {
  recordType: "product_master" | "inventory_snapshot";
  sourceRecordKey: string;
  sourceUpdatedAt: string | null;
  payload: Json;
};

export type ShopifySyncResult =
  | {
      status: "skipped";
      reason:
        | "job-not-found"
        | "organization-mismatch"
        | "not-shopify"
        | "job-not-queued"
        | "not-mvp";
      jobId: string;
      shouldNormalize: false;
    }
  | {
      status: "raw-records-ready";
      jobId: string;
      externalRecords: number;
      shouldNormalize: true;
    }
  | {
      status: "failed";
      jobId: string;
      errorCode: string;
      shouldNormalize: false;
    };

export type ShopifySyncStore = {
  getEnvelope(jobId: string): Promise<ShopifySyncEnvelope | null>;
  markRunning(jobId: string): Promise<void>;
  upsertExternalRecords(
    envelope: ShopifySyncEnvelope,
    records: ShopifyExternalRecord[],
  ): Promise<number>;
  markFailed(
    envelope: Pick<ShopifySyncEnvelope, "jobId" | "organizationId" | "dataSourceId">,
    error: ProviderSyncError,
  ): Promise<void>;
};

export type ShopifyCredentialResolver = {
  resolve(envelope: ShopifySyncEnvelope): Promise<ShopifyCredentials | null>;
};

export type ShopifyProviderClient = {
  fetchRecords(credentials: ShopifyCredentials): Promise<ShopifyExternalRecord[]>;
};

export class ProviderSyncError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.name = "ProviderSyncError";
    this.code = code;
    this.retryable = retryable;
  }
}

const MAX_PROVIDER_ATTEMPTS = 3;

export async function runShopifyMvpSyncJob(
  jobId: string,
  dependencies: {
    store: ShopifySyncStore;
    credentials: ShopifyCredentialResolver;
    client: ShopifyProviderClient;
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

  if (envelope.providerKey !== "shopify") {
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
      "Shopify sync requires an MVP connector data source.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return {
      status: "failed",
      jobId,
      errorCode: error.code,
      shouldNormalize: false,
    };
  }

  if (envelope.dataSourceStatus === "disabled" || envelope.dataSourceStatus === "paused") {
    const error = new ProviderSyncError(
      "data_source.not_syncable",
      "Shopify data source is not syncable.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return {
      status: "failed",
      jobId,
      errorCode: error.code,
      shouldNormalize: false,
    };
  }

  if (envelope.credentialStatus !== "configured") {
    const error = new ProviderSyncError(
      "credentials.missing",
      "Shopify connector credentials are not configured for this data source.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return {
      status: "failed",
      jobId,
      errorCode: error.code,
      shouldNormalize: false,
    };
  }

  const credentials = await dependencies.credentials.resolve(envelope);
  if (!credentials) {
    const error = new ProviderSyncError(
      "credentials.unavailable",
      "Shopify connector credentials are marked configured but are unavailable to the server worker.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return {
      status: "failed",
      jobId,
      errorCode: error.code,
      shouldNormalize: false,
    };
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
    return {
      status: "failed",
      jobId,
      errorCode: syncError.code,
      shouldNormalize: false,
    };
  }

  if (records.length === 0) {
    const error = new ProviderSyncError(
      "provider.empty_response",
      "Shopify returned no product or inventory records to ingest.",
      false,
    );
    await dependencies.store.markFailed(envelope, error);
    return {
      status: "failed",
      jobId,
      errorCode: error.code,
      shouldNormalize: false,
    };
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

export function toProviderSyncError(error: unknown) {
  if (error instanceof ProviderSyncError) return error;

  return new ProviderSyncError(
    "provider.request_failed",
    "Shopify provider request failed before raw records could be persisted.",
    true,
  );
}

export function externalRecordStatusForProviderWrite(): ExternalRecordStatus {
  return "received";
}
