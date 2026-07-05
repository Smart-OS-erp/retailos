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
  });

  it("defaults operational and viewer roles to organization visibility only", () => {
    for (const role of organizationRoles.filter(
      (candidate) =>
        candidate !== "org_owner" && candidate !== "executive",
    )) {
      expect(hasPermission(role, "organization.view")).toBe(true);
      expect(hasPermission(role, "organization.manage")).toBe(false);
      expect(hasPermission(role, "members.view")).toBe(false);
      expect(hasPermission(role, "members.manage")).toBe(false);
      expect(hasPermission(role, "audit.view")).toBe(false);
    }
  });
});
