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
  "data.view",
  "data.manage",
  "inventory.view",
  "intelligence.run",
  "opportunity.view",
  "project.view",
  "project.manage",
  "project.approve",
  "task.view",
  "task.manage",
  "campaign_brief.view",
  "campaign_brief.manage",
  "campaign_brief.approve",
  "copilot.use",
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
    "data.view",
    "inventory.view",
  ]),
  merchandising_manager: new Set([
    "organization.view",
    "location.view",
    "brand.view",
    "brand.manage",
    "data.view",
    "data.manage",
    "inventory.view",
  ]),
  store_manager: new Set([
    "organization.view",
    "location.view",
    "brand.view",
    "inventory.view",
  ]),
  viewer: new Set([
    "organization.view",
    "location.view",
    "brand.view",
    "data.view",
    "inventory.view",
  ]),
};

export function hasPermission(
  role: OrganizationRole,
  permission: Permission,
) {
  return rolePermissions[role].has(permission);
}

export function permissionsForRole(
  role: OrganizationRole,
): ReadonlySet<Permission> {
  return rolePermissions[role];
}
