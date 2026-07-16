import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { verifyProviderCredentialAvailability } from "@/lib/integrations/provider-credential-verification";
import type { ShopifyCredentialResolver } from "@/lib/integrations/shopify-worker";
import type { WooCommerceCredentialResolver } from "@/lib/integrations/woocommerce-credentials";

const baseInput = {
  connectorDepth: "mvp",
  credentialStatus: "missing",
  dataSourceId: "20000000-0000-4000-8000-000000000001",
  dataSourceStatus: "configuration_required",
  organizationId: "10000000-0000-4000-8000-000000000001",
  providerKey: "shopify",
  sourceKey: "lagos-shopify",
} as const;

const configuredResolver: ShopifyCredentialResolver = {
  async resolve() {
    return {
      adminAccessToken: "test-admin-token",
      apiVersion: "2026-07",
      shopDomain: "retailos-test.myshopify.com",
    };
  },
};

const configuredWooCommerceResolver: WooCommerceCredentialResolver = {
  async resolve() {
    return {
      apiVersion: "wc/v3",
      consumerKey: "ck_testconsumerkey",
      consumerSecret: "cs_testconsumersecret",
      siteUrl: "https://store.example.com",
    };
  },
};

const missingResolver: ShopifyCredentialResolver = {
  async resolve() {
    return null;
  },
};

describe("provider credential availability verification", () => {
  it("marks Shopify credentials available only when server-side material resolves", async () => {
    await expect(
      verifyProviderCredentialAvailability(baseInput, {
        shopifyCredentials: configuredResolver,
      }),
    ).resolves.toEqual({
      code: "credentials.available",
      credentialStatus: "configured",
      status: "available",
    });
  });

  it("fails closed when server-side credential material is missing", async () => {
    await expect(
      verifyProviderCredentialAvailability(baseInput, {
        shopifyCredentials: missingResolver,
      }),
    ).resolves.toEqual({
      code: "credentials.missing",
      credentialStatus: "missing",
      status: "unavailable",
    });
  });

  it("marks WooCommerce credentials available only when server-side material resolves", async () => {
    await expect(
      verifyProviderCredentialAvailability({
        ...baseInput,
        providerKey: "woocommerce",
        sourceKey: "lagos-woocommerce",
      }, {
        wooCommerceCredentials: configuredWooCommerceResolver,
      }),
    ).resolves.toEqual({
      code: "credentials.available",
      credentialStatus: "configured",
      status: "available",
    });
  });

  it("does not approve unsupported providers or non-MVP connectors", async () => {
    await expect(
      verifyProviderCredentialAvailability({
        ...baseInput,
        providerKey: "google_sheets",
      }),
    ).resolves.toMatchObject({
      code: "provider.unsupported",
      status: "unavailable",
    });

    await expect(
      verifyProviderCredentialAvailability({
        ...baseInput,
        connectorDepth: "scaffold",
      }),
    ).resolves.toMatchObject({
      code: "connector.not_mvp",
      status: "unavailable",
    });
  });
});
