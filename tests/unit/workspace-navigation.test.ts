import { describe, expect, it } from "vitest";

import { workspaceNavigation, workspacePathForRole } from "@/lib/navigation/workspace";

describe("workspace navigation", () => {
  it("routes each role to its approved Phase 0 workspace", () => {
    expect(workspacePathForRole("org_owner")).toBe("/workspace/executive");
    expect(workspacePathForRole("executive")).toBe("/workspace/executive");
    expect(workspacePathForRole("merchandising_manager")).toBe(
      "/workspace/merchandising",
    );
    expect(workspacePathForRole("store_manager")).toBe("/workspace/store");
    expect(workspacePathForRole("viewer")).toBe("/workspace/viewer");
  });

  it("does not show data intake navigation to store managers", () => {
    expect(
      workspaceNavigation("store_manager").some((item) => item.href === "/data"),
    ).toBe(false);
    expect(
      workspaceNavigation("store_manager").some(
        (item) => item.href === "/copilot",
      ),
    ).toBe(true);
  });

  it("shows Integration Hub only to roles with Phase 0.5 integration visibility", () => {
    expect(
      workspaceNavigation("org_owner").some(
        (item) => item.href === "/integrations",
      ),
    ).toBe(true);
    expect(
      workspaceNavigation("executive").some(
        (item) => item.href === "/integrations",
      ),
    ).toBe(true);
    expect(
      workspaceNavigation("merchandising_manager").some(
        (item) => item.href === "/integrations",
      ),
    ).toBe(true);
    expect(
      workspaceNavigation("store_manager").some(
        (item) => item.href === "/integrations",
      ),
    ).toBe(false);
    expect(
      workspaceNavigation("viewer").some(
        (item) => item.href === "/integrations",
      ),
    ).toBe(false);
  });
});
