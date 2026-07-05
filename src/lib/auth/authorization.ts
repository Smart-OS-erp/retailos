export const organizationRoles = [
  "org_owner",
  "executive",
  "merchandising_manager",
  "store_manager",
  "viewer",
] as const;

export type OrganizationRole = (typeof organizationRoles)[number];

export const permissions = [
  "organization.view",
  "organization.manage",
  "members.view",
  "members.manage",
  "audit.view",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<OrganizationRole, ReadonlySet<Permission>> = {
  org_owner: new Set(permissions),
  executive: new Set(["organization.view", "members.view", "audit.view"]),
  merchandising_manager: new Set(["organization.view"]),
  store_manager: new Set(["organization.view"]),
  viewer: new Set(["organization.view"]),
};

export function hasPermission(
  role: OrganizationRole,
  permission: Permission,
) {
  return rolePermissions[role].has(permission);
}
