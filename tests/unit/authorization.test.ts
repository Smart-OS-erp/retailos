import { describe, expect, it } from "vitest";

import {
  hasPermission,
  organizationRoles,
  permissions,
} from "@/lib/auth/authorization";

describe("organization RBAC", () => {
  it("gives owners every Phase 0 foundation permission", () => {
    for (const permission of permissions) {
      expect(hasPermission("org_owner", permission)).toBe(true);
    }
  });

  it("keeps executive access read-oriented", () => {
    expect(hasPermission("executive", "organization.view")).toBe(true);
    expect(hasPermission("executive", "members.view")).toBe(true);
    expect(hasPermission("executive", "audit.view")).toBe(true);
    expect(hasPermission("executive", "organization.manage")).toBe(false);
    expect(hasPermission("executive", "members.manage")).toBe(false);
    expect(hasPermission("executive", "location.view")).toBe(true);
    expect(hasPermission("executive", "brand.view")).toBe(true);
    expect(hasPermission("executive", "onboarding.view")).toBe(true);
    expect(hasPermission("executive", "event.view")).toBe(true);
    expect(hasPermission("executive", "location.manage")).toBe(false);
    expect(hasPermission("executive", "brand.manage")).toBe(false);
    expect(hasPermission("executive", "integration.view")).toBe(true);
    expect(hasPermission("executive", "integration.manage")).toBe(false);
    expect(hasPermission("executive", "integration.sync")).toBe(false);
    expect(hasPermission("executive", "integration.import")).toBe(false);
  });

  it("gives store and viewer roles read-only foundation visibility", () => {
    for (const role of ["store_manager", "viewer"] as const) {
      expect(hasPermission(role, "organization.view")).toBe(true);
      expect(hasPermission(role, "location.view")).toBe(true);
      expect(hasPermission(role, "brand.view")).toBe(true);
      expect(hasPermission(role, "organization.manage")).toBe(false);
      expect(hasPermission(role, "members.view")).toBe(false);
      expect(hasPermission(role, "members.manage")).toBe(false);
      expect(hasPermission(role, "audit.view")).toBe(false);
      expect(hasPermission(role, "location.manage")).toBe(false);
      expect(hasPermission(role, "brand.manage")).toBe(false);
      expect(hasPermission(role, "onboarding.manage")).toBe(false);
      expect(hasPermission(role, "event.view")).toBe(false);
      expect(hasPermission(role, "integration.view")).toBe(false);
      expect(hasPermission(role, "integration.manage")).toBe(false);
      expect(hasPermission(role, "integration.sync")).toBe(false);
      expect(hasPermission(role, "integration.import")).toBe(false);
    }
  });

  it("lets merchandising manage brands without tenant administration", () => {
    expect(hasPermission("merchandising_manager", "organization.view")).toBe(
      true,
    );
    expect(hasPermission("merchandising_manager", "location.view")).toBe(true);
    expect(hasPermission("merchandising_manager", "brand.view")).toBe(true);
    expect(hasPermission("merchandising_manager", "brand.manage")).toBe(true);
    expect(hasPermission("merchandising_manager", "location.manage")).toBe(
      false,
    );
    expect(hasPermission("merchandising_manager", "onboarding.manage")).toBe(
      false,
    );
    expect(hasPermission("merchandising_manager", "integration.view")).toBe(
      true,
    );
    expect(hasPermission("merchandising_manager", "integration.manage")).toBe(
      true,
    );
    expect(hasPermission("merchandising_manager", "integration.sync")).toBe(
      true,
    );
    expect(hasPermission("merchandising_manager", "integration.import")).toBe(
      true,
    );
  });

  it("keeps the canonical role catalogue stable", () => {
    expect(organizationRoles).toEqual([
      "org_owner",
      "executive",
      "merchandising_manager",
      "store_manager",
      "viewer",
    ]);
  });
});
