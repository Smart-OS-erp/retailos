import type { OrganizationRole } from "@/lib/auth/authorization";
import { retailNavigationForRole } from "@/lib/ui/navigation-config";

export type NavigationItem = Readonly<{ label: string; href: string }>;

export function workspaceNavigation(
  role: OrganizationRole,
): readonly NavigationItem[] {
  return retailNavigationForRole(role).map((item) => ({
    href: item.href,
    label: item.label,
  }));
}

export function workspacePathForRole(role: OrganizationRole) {
  const paths: Record<OrganizationRole, string> = {
    org_owner: "/workspace/executive",
    executive: "/workspace/executive",
    merchandising_manager: "/workspace/merchandising",
    store_manager: "/workspace/store",
    viewer: "/workspace/viewer",
  };

  return paths[role];
}
