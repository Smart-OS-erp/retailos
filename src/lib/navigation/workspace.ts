import type { OrganizationRole } from "@/lib/auth/authorization";

export type NavigationItem = Readonly<{ label: string; href: string }>;

const coreItems: readonly NavigationItem[] = [
  { label: "Workspace", href: "/workspace" },
  { label: "Data", href: "/data" },
  { label: "Consolidation Hub", href: "/consolidation" },
  { label: "Inventory Recovery", href: "/inventory-recovery" },
  { label: "Attention Queue", href: "/attention-queue" },
  { label: "Projectisation", href: "/projectisation" },
  { label: "Tasks", href: "/tasks" },
  { label: "Retail Copilot", href: "/copilot" },
];

export function workspaceNavigation(
  role: OrganizationRole,
): readonly NavigationItem[] {
  if (role === "store_manager") {
    return coreItems.filter((item) => item.href !== "/data");
  }

  return coreItems;
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
