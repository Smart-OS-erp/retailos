import { hasPermission, type OrganizationRole } from "@/lib/auth/authorization";

export type RetailNavigationGroup =
  | "data-foundation"
  | "execution"
  | "intelligence"
  | "setup";

export type RetailNavigationItem = Readonly<{
  group: RetailNavigationGroup;
  href: string;
  id: string;
  label: string;
  phase: "phase-0" | "phase-0.5";
  provisional: true;
  requiredPermission?: "integration.view";
}>;

export const retailNavigationItems: readonly RetailNavigationItem[] = [
  {
    group: "setup",
    href: "/workspace",
    id: "workspace",
    label: "Workspace",
    phase: "phase-0",
    provisional: true,
  },
  {
    group: "data-foundation",
    href: "/data",
    id: "data",
    label: "Data",
    phase: "phase-0",
    provisional: true,
  },
  {
    group: "data-foundation",
    href: "/integrations",
    id: "integration-hub",
    label: "Integration Hub",
    phase: "phase-0.5",
    provisional: true,
    requiredPermission: "integration.view",
  },
  {
    group: "data-foundation",
    href: "/consolidation",
    id: "consolidation-hub",
    label: "Consolidation Hub",
    phase: "phase-0",
    provisional: true,
  },
  {
    group: "intelligence",
    href: "/inventory-recovery",
    id: "inventory-recovery",
    label: "Inventory Recovery",
    phase: "phase-0",
    provisional: true,
  },
  {
    group: "intelligence",
    href: "/attention-queue",
    id: "attention-queue",
    label: "Attention Queue",
    phase: "phase-0",
    provisional: true,
  },
  {
    group: "execution",
    href: "/projectisation",
    id: "projectisation",
    label: "Projectisation",
    phase: "phase-0",
    provisional: true,
  },
  {
    group: "execution",
    href: "/tasks",
    id: "tasks",
    label: "Tasks",
    phase: "phase-0",
    provisional: true,
  },
  {
    group: "intelligence",
    href: "/copilot",
    id: "retail-copilot",
    label: "Retail Copilot",
    phase: "phase-0",
    provisional: true,
  },
  {
    group: "setup",
    href: "/onboarding",
    id: "setup-status",
    label: "Setup status",
    phase: "phase-0",
    provisional: true,
  },
];

export function retailNavigationForRole(
  role: OrganizationRole,
): readonly RetailNavigationItem[] {
  return retailNavigationItems.filter((item) => {
    if (item.href === "/data" && role === "store_manager") return false;
    if (item.requiredPermission) return hasPermission(role, item.requiredPermission);
    return true;
  });
}
