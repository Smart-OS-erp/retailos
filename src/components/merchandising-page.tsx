import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import type { OrganizationRole } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

type MerchandisingPageProps = {
  children: (context: {
    membership: {
      organization_id: string;
      role: OrganizationRole;
      status: "active";
    };
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"];
    user: Awaited<ReturnType<typeof requireOrganizationContext>>["user"];
  }) => Promise<ReactNode> | ReactNode;
  description: string;
  milestone: string;
  title: string;
};

export async function MerchandisingPage({
  children,
  description,
  milestone,
  title,
}: MerchandisingPageProps) {
  const context = await requireOrganizationContext();

  return (
    <AppShell
      email={context.user.email ?? "Signed-in user"}
      organizationName={context.organization.name}
      role={context.membership.role}
    >
      <header className="page-header">
        <p className="eyebrow">Phase 2 - {milestone}</p>
        <h1>{title}</h1>
        <p className="lede">{description}</p>
      </header>
      {await children(context)}
    </AppShell>
  );
}
