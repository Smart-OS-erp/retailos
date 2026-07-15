import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function source(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath), "utf8");
}

describe("hosted migration bundle contract", () => {
  it("keeps a pending Phase 0.5 bundle for unapplied hosted migrations", async () => {
    const script = await source("scripts/build-hosted-migration-bundle.ts");
    const packageJson = await source("package.json");

    expect(script).toContain("const phase05PendingMigrations = [");
    expect(script).toContain("20260715133000_phase0_5_pipeline_handoff.sql");
    expect(script).toContain("20260715143000_phase0_5_record_type_mappings.sql");
    expect(script).toContain("20260715152000_phase0_5_provider_mvp_promotion.sql");
    expect(script).toContain("--phase0-5-pending");
    expect(packageJson).toContain("migration:hosted-phase0-5-pending-bundle");
  });
});
