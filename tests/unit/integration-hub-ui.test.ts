import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function source(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath), "utf8");
}

describe("Integration Hub UI contract", () => {
  it("uses reviewed Phase 0.5 RPCs for source creation and scaffold sync", async () => {
    const actions = await source("src/app/integrations/actions.ts");

    expect(actions).toContain("\"create_data_source\"");
    expect(actions).toContain("\"enqueue_data_source_sync\"");
    expect(actions).toContain("integration.manage");
    expect(actions).toContain("integration.sync");
    expect(actions).toContain("allowedReturnPaths");
  });

  it("keeps connector secrets out of browser-facing integration UI", async () => {
    const ui = await source("src/components/integration-hub.tsx");

    expect(ui).toContain("How do you currently manage inventory and sales?");
    expect(ui).toContain("RetailOS connects to the system behind the sales channel");
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
});
