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
];

export function workspaceNavigation(
  role: OrganizationRole,
): readonly NavigationItem[] {
  if (role === "store_manager") {
    return coreItems.filter((item) => item.href !== "/data");
  }

  return coreItems;
}
