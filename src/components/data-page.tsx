import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { hasPermission } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

type DataPageProps = {
  children: (context: Awaited<ReturnType<typeof requireOrganizationContext>>) => ReactNode;
  description: string;
  title: string;
};

export async function DataPage({ children, description, title }: DataPageProps) {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.membership.role, "data.view")) {
    redirect("/workspace?error=permission-denied");
  }

  return (
    <AppShell
      email={context.user.email ?? "Signed-in user"}
      organizationName={context.organization.name}
      role={context.membership.role}
    >
      <header className="page-header">
        <p className="eyebrow">Trusted data intake</p>
        <h1>{title}</h1>
        <p className="lede">{description}</p>
      </header>
      {children(context)}
    </AppShell>
  );
}
