import "server-only";

import { redirect } from "next/navigation";

import type { OrganizationRole } from "@/lib/auth/authorization";
import { requireUser } from "@/lib/auth/require-user";

export async function requireOrganizationContext() {
  const { supabase, user } = await requireUser();
  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(2);

  if (error || memberships?.length !== 1) {
    redirect("/onboarding?error=organization-context");
  }

  const membership = memberships[0];
  if (!membership || membership.status !== "active") {
    redirect("/onboarding?error=organization-context");
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (organizationError || !organization) {
    redirect("/onboarding?error=authorization");
  }

  return {
    membership: {
      organization_id: membership.organization_id,
      role: membership.role as OrganizationRole,
      status: "active" as const,
    },
    organization,
    supabase,
    user,
  };
}
