import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  formatRetailCurrency,
  formatRetailDateTime,
  resolveTenantMarketConfig,
  RETAILOS_DEFAULT_MARKET,
} from "@/lib/ui/market";
import { retailNavigationItems } from "@/lib/ui/navigation-config";
import { provisionalDashboardConfig } from "@/lib/ui/dashboard-config";
import { getRetailStatusPresentation } from "@/lib/ui/status";

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const target = path.join(directory, entry);
    const details = await stat(target);
    if (details.isDirectory()) {
      files.push(...(await sourceFiles(target)));
    } else if (/\.(?:ts|tsx|json)$/.test(entry)) {
      files.push(target);
    }
  }

  return files;
}

describe("M0-UI foundation", () => {
  it("uses Nigeria market defaults with tenant override support", () => {
    expect(RETAILOS_DEFAULT_MARKET).toEqual({
      country: "Nigeria",
      countryCode: "NG",
      currency: "NGN",
      locale: "en-NG",
      timeZone: "Africa/Lagos",
    });

    expect(
      resolveTenantMarketConfig({
        currency: "GHS",
        locale: "en-GH",
        timeZone: "Africa/Accra",
      }),
    ).toMatchObject({
      country: "Nigeria",
      currency: "GHS",
      locale: "en-GH",
      timeZone: "Africa/Accra",
    });
  });

  it("formats currency and dates through shared Intl utilities", () => {
    expect(formatRetailCurrency(128_430_000)).toContain("128,430,000");
    expect(formatRetailDateTime("2026-07-16T08:00:00Z")).toContain("2026");
  });

  it("marks navigation and dashboard architecture as provisional", () => {
    expect(retailNavigationItems.length).toBeGreaterThan(0);
    expect(retailNavigationItems.every((item) => item.provisional)).toBe(true);
    expect(provisionalDashboardConfig.provisional).toBe(true);
    expect(
      provisionalDashboardConfig.cards.every((card) => card.provisional),
    ).toBe(true);
  });

  it("provides non-color status presentation", () => {
    const status = getRetailStatusPresentation("configuration_required");

    expect(status).toEqual({
      assistiveLabel: "Status requires configuration",
      label: "Configuration required",
      tone: "warning",
    });
  });

  it("configures shadcn/ui without Ant Design", async () => {
    const componentsJson = await readFile(
      path.join(process.cwd(), "components.json"),
      "utf8",
    );
    const packageJson = await readFile(
      path.join(process.cwd(), "package.json"),
      "utf8",
    );

    expect(componentsJson).toContain("https://ui.shadcn.com/schema.json");
    expect(packageJson).not.toMatch(/"antd"|@ant-design|ant-design/i);
  });

  it("keeps UI modules on shared currency formatting and RetailDataGrid", async () => {
    const componentFiles = await sourceFiles(path.join(process.cwd(), "src/components"));

    for (const file of componentFiles) {
      const source = await readFile(file, "utf8");
      expect(source, file).not.toMatch(/["'`]₦|NGN\s*\+|\+\s*["'`]NGN/);
    }

    const integrationHub = await readFile(
      path.join(process.cwd(), "src/components/integration-hub.tsx"),
      "utf8",
    );
    expect(integrationHub).toContain("RetailDataGrid");
    expect(integrationHub).toContain("formatRetailDateTime");
    expect(integrationHub).toContain("StatusBadge");
  });
});
