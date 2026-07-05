"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getOnboardingContext } from "@/lib/navigation/onboarding";
import {
  isValidOrganizationSlug,
  normalizeOrganizationSlug,
} from "@/lib/organizations/slug";
import type { OnboardingStep, OnboardingStepStatus } from "@/types/database";

const CODE_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const APPROVED_TIMEZONES = new Set([
  "Africa/Accra",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
]);

async function authorizedOrganizationId(formData: FormData, errorPath: string) {
  const submittedOrganizationId = String(formData.get("organizationId") ?? "");
  const context = await getOnboardingContext();

  if (!context || submittedOrganizationId !== context.organization.id) {
    redirect(`${errorPath}?error=authorization`);
  }

  return context.organization.id;
}

async function updateStep(
  organizationId: string,
  step: OnboardingStep,
  status: OnboardingStepStatus,
  errorPath: string,
) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("set_onboarding_step", {
    target_organization_id: organizationId,
    target_status: status,
    target_step: step,
  });

  if (error) {
    redirect(`${errorPath}?error=save`);
  }
}

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
    redirect("/create-organization?error=invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("create_organization", {
    organization_name: name,
    organization_slug: slug,
  });

  if (error) {
    redirect("/create-organization?error=create");
  }

  redirect("/onboarding/company?created=1");
}

export async function completeCompanyProfile(formData: FormData) {
  const organizationId = await authorizedOrganizationId(
    formData,
    "/onboarding/company",
  );
  await updateStep(
    organizationId,
    "company_profile",
    "completed",
    "/onboarding/company",
  );
  redirect("/onboarding/locations");
}

export async function createFirstLocation(formData: FormData) {
  const organizationId = await authorizedOrganizationId(
    formData,
    "/onboarding/locations",
  );
  const name = String(formData.get("locationName") ?? "").trim();
  const code = String(formData.get("locationCode") ?? "").trim().toUpperCase();
  const timezone = String(formData.get("timezone") ?? "");

  if (
    !organizationId
    || name.length < 2
    || name.length > 120
    || code.length < 2
    || code.length > 32
    || !CODE_PATTERN.test(code)
    || !APPROVED_TIMEZONES.has(timezone)
  ) {
    redirect("/onboarding/locations?error=invalid");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("locations").insert({
    code,
    created_by: user.id,
    name,
    organization_id: organizationId,
    timezone,
  });

  if (error) {
    redirect("/onboarding/locations?error=create");
  }

  await updateStep(
    organizationId,
    "first_location",
    "completed",
    "/onboarding/locations",
  );
  redirect("/onboarding/brands");
}

export async function completeLocationStep(formData: FormData) {
  const organizationId = await authorizedOrganizationId(
    formData,
    "/onboarding/locations",
  );
  const { supabase } = await requireUser();
  const { count, error } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error || !count) {
    redirect("/onboarding/locations?error=location-required");
  }

  await updateStep(
    organizationId,
    "first_location",
    "completed",
    "/onboarding/locations",
  );
  redirect("/onboarding/brands");
}

export async function addBrandAndContinue(formData: FormData) {
  const organizationId = await authorizedOrganizationId(
    formData,
    "/onboarding/brands",
  );
  const name = String(formData.get("brandName") ?? "").trim();
  const code = String(formData.get("brandCode") ?? "").trim().toUpperCase();

  if (
    !organizationId
    || name.length < 2
    || name.length > 120
    || code.length < 2
    || code.length > 32
    || !CODE_PATTERN.test(code)
  ) {
    redirect("/onboarding/brands?error=invalid");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("brands").insert({
    code,
    created_by: user.id,
    name,
    organization_id: organizationId,
  });

  if (error) {
    redirect("/onboarding/brands?error=create");
  }

  await updateStep(
    organizationId,
    "brands",
    "completed",
    "/onboarding/brands",
  );
  redirect("/onboarding/team");
}

export async function skipBrands(formData: FormData) {
  const organizationId = await authorizedOrganizationId(
    formData,
    "/onboarding/brands",
  );
  await updateStep(
    organizationId,
    "brands",
    "skipped",
    "/onboarding/brands",
  );
  redirect("/onboarding/team");
}

export async function completeBrandsStep(formData: FormData) {
  const organizationId = await authorizedOrganizationId(
    formData,
    "/onboarding/brands",
  );
  const { supabase } = await requireUser();
  const { count, error } = await supabase
    .from("brands")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error || !count) {
    redirect("/onboarding/brands?error=brand-required");
  }

  await updateStep(
    organizationId,
    "brands",
    "completed",
    "/onboarding/brands",
  );
  redirect("/onboarding/team");
}

export async function continueWithoutTeam(formData: FormData) {
  const organizationId = await authorizedOrganizationId(
    formData,
    "/onboarding/team",
  );
  await updateStep(
    organizationId,
    "team",
    "skipped",
    "/onboarding/team",
  );
  redirect("/onboarding/data-source");
}

export async function confirmDataSourceReadiness(formData: FormData) {
  const organizationId = await authorizedOrganizationId(
    formData,
    "/onboarding/data-source",
  );
  const acknowledged = formData.get("dataReadiness") === "acknowledged";
  if (!acknowledged) {
    redirect("/onboarding/data-source?error=acknowledgement");
  }

  await updateStep(
    organizationId,
    "data_source",
    "completed",
    "/onboarding/data-source",
  );
  redirect("/onboarding/complete");
}
