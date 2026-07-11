import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("setup error page", () => {
  it("explains setup-state failures without exposing secrets or fake success", async () => {
    const source = await readFile(
      path.join(process.cwd(), "src/app/setup-error/page.tsx"),
      "utf8",
    );

    expect(source).toContain("Retry setup");
    expect(source).toContain("hosted Supabase Phase 0 migrations");
    expect(source).toContain("fail-closed guardrail");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("DATABASE_URL");
  });
});
