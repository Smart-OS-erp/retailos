import "server-only";

import { EnvShopifyCredentialResolver } from "@/lib/integrations/shopify-credentials";
import type {
  ShopifyCredentialResolver,
  ShopifySyncEnvelope,
} from "@/lib/integrations/shopify-worker";
import type {
  DataSourceStatus,
  IntegrationConnectorDepth,
  IntegrationCredentialStatus,
} from "@/types/database";

export type ProviderCredentialVerificationInput = Readonly<{
  connectorDepth: IntegrationConnectorDepth;
  credentialStatus: IntegrationCredentialStatus;
  dataSourceId: string;
  dataSourceStatus: DataSourceStatus;
  organizationId: string;
  providerKey: string;
  sourceKey: string;
}>;

export type ProviderCredentialVerificationResult =
  | Readonly<{
      code: "credentials.available";
      credentialStatus: "configured";
      status: "available";
    }>
  | Readonly<{
      code:
        | "credentials.missing"
        | "connector.not_mvp"
        | "provider.unsupported";
      credentialStatus: "missing";
      status: "unavailable";
    }>;

export async function verifyProviderCredentialAvailability(
  input: ProviderCredentialVerificationInput,
  dependencies?: {
    shopifyCredentials?: ShopifyCredentialResolver;
  },
): Promise<ProviderCredentialVerificationResult> {
  if (input.providerKey !== "shopify") {
    return {
      code: "provider.unsupported",
      credentialStatus: "missing",
      status: "unavailable",
    };
  }

  if (input.connectorDepth !== "mvp") {
    return {
      code: "connector.not_mvp",
      credentialStatus: "missing",
      status: "unavailable",
    };
  }

  const resolver =
    dependencies?.shopifyCredentials ?? new EnvShopifyCredentialResolver();
  const credentials = await resolver.resolve(toShopifyEnvelope(input));

  if (!credentials) {
    return {
      code: "credentials.missing",
      credentialStatus: "missing",
      status: "unavailable",
    };
  }

  return {
    code: "credentials.available",
    credentialStatus: "configured",
    status: "available",
  };
}

function toShopifyEnvelope(
  input: ProviderCredentialVerificationInput,
): ShopifySyncEnvelope {
  return {
    connectorDepth: input.connectorDepth,
    credentialStatus: input.credentialStatus,
    dataSourceId: input.dataSourceId,
    dataSourceStatus: input.dataSourceStatus,
    jobId: "00000000-0000-4000-8000-000000000000",
    organizationId: input.organizationId,
    providerKey: input.providerKey,
    sourceKey: input.sourceKey,
    syncJobStatus: "queued",
  };
}
