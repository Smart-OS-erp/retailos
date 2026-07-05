import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const target = path.join(directory, entry);
    const details = await stat(target);
    if (details.isDirectory()) {
      files.push(...(await sourceFiles(target)));
    } else if (/\.(?:ts|tsx)$/.test(entry)) {
      files.push(target);
    }
  }

  return files;
}

describe("foundation security boundaries", () => {
  it("keeps service-role and database credentials out of browser modules", async () => {
    const files = await sourceFiles(path.join(process.cwd(), "src"));
    const browserFiles: string[] = [];

    for (const file of files) {
      const source = await readFile(file, "utf8");
      if (
        /^\s*["']use client["'];/m.test(source)
        || /(?:browser|client)\.(?:ts|tsx)$/.test(file)
      ) {
        browserFiles.push(file);
        expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
        expect(source).not.toContain("DATABASE_URL");
      }
    }

    expect(browserFiles.length).toBeGreaterThan(0);
  });

  it("marks server secrets as server-only", async () => {
    const source = await readFile(
      path.join(process.cwd(), "src/lib/env/server.ts"),
      "utf8",
    );

    expect(source).toMatch(/^import "server-only";/);
    expect(source).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).toContain("DATABASE_URL");
  });

  it("requires server-side authorization in protected pages and actions", async () => {
    const page = await readFile(
      path.join(process.cwd(), "src/app/onboarding/page.tsx"),
      "utf8",
    );
    const action = await readFile(
      path.join(process.cwd(), "src/app/onboarding/actions.ts"),
      "utf8",
    );
    const navigation = await readFile(
      path.join(process.cwd(), "src/lib/navigation/onboarding.ts"),
      "utf8",
    );

    expect(page).toContain("getOnboardingContext()");
    expect(navigation).toContain("requireUser()");
    expect(action).toContain("requireUser()");
  });

  it("contains no dashboard or future-phase route", async () => {
    const files = await sourceFiles(path.join(process.cwd(), "src/app"));
    const normalized = files.map((file) => file.replaceAll("\\", "/"));

    expect(normalized.some((file) => file.includes("/dashboard/"))).toBe(false);
    expect(normalized.some((file) => file.includes("/finance/"))).toBe(false);
    expect(normalized.some((file) => file.includes("/wholesale/"))).toBe(false);
  });
});
