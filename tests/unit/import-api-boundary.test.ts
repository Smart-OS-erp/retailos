import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function fileExists(relativePath: string) {
  try {
    await access(path.join(process.cwd(), relativePath));
    return true;
  } catch {
    return false;
  }
}

describe("Import API boundary", () => {
  it("documents tenant scope, token storage, idempotency, and pipeline boundaries", async () => {
    const source = await readFile(
      path.join(process.cwd(), "docs/IMPORT_API_BOUNDARY.md"),
      "utf8",
    );

    expect(source).toContain("Tenant scope is");
    expect(source).toContain("stored as a keyed hash");
    expect(source).toContain("is required for every request");
    expect(source).toContain("external_records");
    expect(source).toContain("must not write directly");
    expect(source).toContain("service role is not used");
  });

  it("exposes the Import API route only through the reviewed control plane", async () => {
    await expect(fileExists("src/app/api/import/v1/records/route.ts")).resolves.toBe(true);

    const routeSource = await readFile(
      path.join(process.cwd(), "src/app/api/import/v1/records/route.ts"),
      "utf8",
    );

    expect(routeSource).toContain("authorizeImportApiRequest");
    expect(routeSource).toContain("PostgresImportApiStore");
    expect(routeSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
