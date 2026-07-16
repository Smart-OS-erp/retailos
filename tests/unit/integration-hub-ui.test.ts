import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function source(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath), "utf8");
}

describe("Integration Hub UI contract", () => {
  it("uses reviewed Phase 0.5 RPCs for source creation and credential-gated sync", async () => {
    const actions = await source("src/app/integrations/actions.ts");

    expect(actions).toContain("\"create_data_source\"");
    expect(actions).toContain("\"enqueue_data_source_sync\"");
    expect(actions).toContain("verifyProviderCredentials");
    expect(actions).toContain("integration.manage");
    expect(actions).toContain("integration.sync");
    expect(actions).toContain("allowedReturnPaths");
  });

  it("keeps connector secrets out of browser-facing integration UI", async () => {
    const ui = await source("src/components/integration-hub.tsx");

    expect(ui).toContain("How do you currently manage inventory and sales?");
    expect(ui).toContain("RetailOS connects to the system behind the sales channel");
    expect(ui).toContain("Route deployed; credential setup remains server-side");
    expect(ui).toContain("Verify server credentials");
    expect(ui).toContain("credentialVerifiableProviderKeys");
    expect(ui).toContain("\"woocommerce\"");
    expect(ui).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(ui).not.toContain("DATABASE_URL");
    expect(ui).not.toContain("SHOPIFY_ACCESS_TOKEN");
    expect(ui).not.toContain("WOOCOMMERCE_CONSUMER_SECRET");
    expect(ui).not.toContain("GOOGLE_SERVICE_ACCOUNT");
  });

  it("keeps onboarding completion behind a saved data source", async () => {
    const page = await source("src/app/onboarding/data-source/page.tsx");

    expect(page).toContain("const canComplete = dataSources.length > 0");
    expect(page).toContain("disabled={!canComplete}");
    expect(page).toContain("returnPath=\"/onboarding/data-source\"");
  });

  it("records MVP connector depth decisions without exposing provider secrets", async () => {
    const strategy = await source("docs/PHASE_0_5_CONNECTOR_STRATEGY.md");

    expect(strategy).toContain("Shopify, WooCommerce, and Google Sheets at **MVP-approved** depth");
    expect(strategy).toContain("| Shopify | `mvp` |");
    expect(strategy).toContain("| WooCommerce | `mvp` |");
    expect(strategy).toContain("| Google Sheets | `mvp` |");
    expect(strategy).toContain("maximum 3 provider/network attempts per sync job");
    expect(strategy).toContain("Never write directly from a connector into canonical inventory");
  });
});
