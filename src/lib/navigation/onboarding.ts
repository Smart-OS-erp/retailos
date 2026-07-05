import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import type { OrganizationRole } from "@/lib/auth/authorization";

export const onboardingSteps = [
  { id: "company_profile", label: "Company", path: "/onboarding/company" },
  { id: "first_location", label: "Location", path: "/onboarding/locations" },
  { id: "brands", label: "Brands", path: "/onboarding/brands" },
  { id: "team", label: "Team", path: "/onboarding/team" },
  { id: "data_source", label: "Data", path: "/onboarding/data-source" },
  { id: "complete", label: "Finish", path: "/onboarding/complete" },
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number]["id"];

export type OnboardingContext = {
  checklists: Array<{
    status: "not_started" | "in_progress" | "completed" | "skipped";
    step: Exclude<OnboardingStep, "complete">;
  }>;
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
  user: {
    email: string;
    id: string;
  };
};

export async function getOnboardingContext(): Promise<OnboardingContext | null> {
  const { supabase, user } = await requireUser();
  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(2);

  if (membershipError) {
    redirect("/onboarding?error=authorization");
  }

  if (!memberships?.length) {
    return null;
  }

  // Organization switching is not part of this milestone. Fail closed rather
  // than silently choosing a tenant if more than one membership exists.
  if (memberships.length !== 1) {
    redirect("/onboarding?error=organization-context");
  }

  const membership = memberships[0];
  if (!membership || membership.status !== "active") {
    return null;
  }

  const [{ data: organization }, { data: checklists, error: checklistError }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", membership.organization_id)
        .maybeSingle(),
      supabase
        .from("onboarding_checklists")
        .select("step, status")
        .eq("organization_id", membership.organization_id)
        .eq("user_id", user.id),
    ]);

  if (!organization || checklistError || !checklists) {
    redirect("/onboarding?error=setup-state");
  }

  return {
    checklists,
    membership: {
      organization_id: membership.organization_id,
      role: membership.role,
      status: "active",
    },
    organization,
    user: {
      email: user.email ?? "Authenticated user",
      id: user.id,
    },
  };
}

export function nextIncompleteStep(context: OnboardingContext) {
  const checklistByStep = new Map(
    context.checklists.map((item) => [item.step, item.status]),
  );
  const nextStep = onboardingSteps.find(
    (step) =>
      step.id !== "complete"
      && !["completed", "skipped"].includes(checklistByStep.get(step.id) ?? ""),
  );

  return nextStep?.path ?? "/onboarding/complete";
}

export function roleWorkspaceLabel(role: OrganizationRole) {
  const labels: Record<OrganizationRole, string> = {
    org_owner: "Owner workspace",
    executive: "Executive workspace",
    merchandising_manager: "Merchandising workspace",
    store_manager: "Store workspace",
    viewer: "Viewer workspace",
  };

  return labels[role];
}
