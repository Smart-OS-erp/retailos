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
  "location.view",
  "location.manage",
  "brand.view",
  "brand.manage",
  "onboarding.view",
  "onboarding.manage",
  "event.view",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<OrganizationRole, ReadonlySet<Permission>> = {
  org_owner: new Set(permissions),
  executive: new Set([
    "organization.view",
    "members.view",
    "audit.view",
    "location.view",
    "brand.view",
    "onboarding.view",
    "event.view",
  ]),
  merchandising_manager: new Set([
    "organization.view",
    "location.view",
    "brand.view",
    "brand.manage",
  ]),
  store_manager: new Set([
    "organization.view",
    "location.view",
    "brand.view",
  ]),
  viewer: new Set([
    "organization.view",
    "location.view",
    "brand.view",
  ]),
};

export function hasPermission(
  role: OrganizationRole,
  permission: Permission,
) {
  return rolePermissions[role].has(permission);
}
