import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import type { OrganizationRole } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { roleWorkspaceLabel } from "@/lib/navigation/onboarding";
import { workspacePathForRole } from "@/lib/navigation/workspace";

type RoleWorkspacePageProps = {
  allowedRoles: readonly OrganizationRole[];
  children: (
    context: Awaited<ReturnType<typeof requireOrganizationContext>>,
  ) => ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

export async function RoleWorkspacePage({
  allowedRoles,
  children,
  description,
  eyebrow = "Role workspace",
  title,
}: RoleWorkspacePageProps) {
  const context = await requireOrganizationContext();
  if (!allowedRoles.includes(context.membership.role)) {
    redirect(workspacePathForRole(context.membership.role));
  }

  return (
    <AppShell
      email={context.user.email ?? "Signed-in user"}
      organizationName={context.organization.name}
      role={context.membership.role}
    >
      <header className="page-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{description}</p>
        <span className="role-badge">
          {roleWorkspaceLabel(context.membership.role)}
        </span>
      </header>
      {children(context)}
    </AppShell>
  );
}
