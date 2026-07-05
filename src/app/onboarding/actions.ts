"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import {
  isValidOrganizationSlug,
  normalizeOrganizationSlug,
} from "@/lib/organizations/slug";

export async function createOrganization(formData: FormData) {
  const name = String(formData.get("organizationName") ?? "").trim();
  const slug = normalizeOrganizationSlug(
    String(formData.get("organizationSlug") ?? ""),
  );

  if (
    name.length < 2
    || name.length > 120
    || !isValidOrganizationSlug(slug)
  ) {
    redirect("/onboarding?error=invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("create_organization", {
    organization_name: name,
    organization_slug: slug,
  });

  if (error) {
    redirect("/onboarding?error=create");
  }

  redirect("/onboarding?created=1");
}
