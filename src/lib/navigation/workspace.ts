import type { OrganizationRole } from "@/lib/auth/authorization";

export type NavigationItem = Readonly<{ label: string; href: string }>;

const coreItems: readonly NavigationItem[] = [
  { label: "Workspace", href: "/workspace" },
  { label: "Data", href: "/data" },
];

export function workspaceNavigation(
  role: OrganizationRole,
): readonly NavigationItem[] {
  if (role === "store_manager") {
    return coreItems.filter((item) => item.href === "/workspace");
  }

  return coreItems;
}
