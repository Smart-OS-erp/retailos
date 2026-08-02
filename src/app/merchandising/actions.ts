"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import type {
  AssortmentProductRole,
  MerchandisingPlanCycleType,
} from "@/types/database";

function readUuid(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function readInteger(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!/^\d+$/.test(text)) return null;
  return Number.parseInt(text, 10);
}

function readText(value: FormDataEntryValue | null, minLength = 3) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length >= minLength ? text : null;
}

function revalidateMerchandisingRoutes() {
  revalidatePath("/merchandising");
  revalidatePath("/merchandising/productivity");
  revalidatePath("/merchandising/performance");
  revalidatePath("/merchandising/markdowns");
  revalidatePath("/merchandising/plans");
  revalidatePath("/merchandising/recommendations");
}

async function requireMerchandisingManage(fallback: string) {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.membership.role, "merchandising.manage")) {
    redirect(`${fallback}?error=permission-denied`);
  }
  return context;
}

export async function generateMerchandisingRecommendations() {
  const context = await requireMerchandisingManage("/merchandising/recommendations");
  const { error } = await context.supabase.rpc("generate_merchandising_recommendations", {
    target_organization_id: context.membership.organization_id,
  });

  if (error) {
    redirect("/merchandising/recommendations?error=generate-failed");
  }

  revalidateMerchandisingRoutes();
  redirect("/merchandising/recommendations?generated=1");
}

export async function createMarkdownDraft(formData: FormData) {
  const context = await requireMerchandisingManage("/merchandising/markdowns");
  const recommendationId = readUuid(formData.get("recommendationId"));
  const discountPercent = readInteger(formData.get("discountPercent"));
  const reason = readText(formData.get("reason"));

  if (!recommendationId || !discountPercent || !reason) {
    redirect("/merchandising/markdowns?error=invalid-draft");
  }

  const { error } = await context.supabase.rpc("create_markdown_plan_draft", {
    target_discount_percent: discountPercent,
    target_reason: reason,
    target_recommendation_id: recommendationId,
  });

  if (error) {
    redirect("/merchandising/markdowns?error=create-failed");
  }

  revalidateMerchandisingRoutes();
  redirect("/merchandising/markdowns?draft_created=1");
}

export async function createPlanCycle(formData: FormData) {
  const context = await requireMerchandisingManage("/merchandising/plans");
  const cycleType = readText(formData.get("cycleType")) as MerchandisingPlanCycleType | null;
  const seasonLabel = readText(formData.get("seasonLabel"), 2);
  const notes = readText(formData.get("notes"), 0);

  if (!cycleType || !seasonLabel) {
    redirect("/merchandising/plans?error=invalid-cycle");
  }

  const { error } = await context.supabase.rpc("create_merchandising_plan_cycle", {
    target_cycle_type: cycleType,
    target_notes: notes,
    target_organization_id: context.membership.organization_id,
    target_season_label: seasonLabel,
  });

  if (error) {
    redirect("/merchandising/plans?error=create-failed");
  }

  revalidateMerchandisingRoutes();
  redirect("/merchandising/plans?cycle_created=1");
}

export async function addAssortmentItem(formData: FormData) {
  const context = await requireMerchandisingManage("/merchandising/plans");
  const planCycleId = readUuid(formData.get("planCycleId"));
  const productId = readUuid(formData.get("productId"));
  const productRole = readText(formData.get("productRole")) as AssortmentProductRole | null;
  const targetLocationCount = readInteger(formData.get("targetLocationCount"));
  const notes = readText(formData.get("notes"), 0);

  if (!planCycleId || !productId || !productRole) {
    redirect("/merchandising/plans?error=invalid-item");
  }

  const { error } = await context.supabase.rpc("add_assortment_plan_item", {
    target_notes: notes,
    target_plan_cycle_id: planCycleId,
    target_product_id: productId,
    target_product_role: productRole,
    target_target_location_count: targetLocationCount,
  });

  if (error) {
    redirect("/merchandising/plans?error=item-failed");
  }

  revalidateMerchandisingRoutes();
  redirect("/merchandising/plans?item_added=1");
}

export async function approvePlanCycle(formData: FormData) {
  const context = await requireMerchandisingManage("/merchandising/plans");
  const planCycleId = readUuid(formData.get("planCycleId"));

  if (!planCycleId) {
    redirect("/merchandising/plans?error=invalid-cycle");
  }

  const { error } = await context.supabase.rpc("approve_merchandising_plan_cycle", {
    target_plan_cycle_id: planCycleId,
  });

  if (error) {
    redirect("/merchandising/plans?error=approval-failed");
  }

  revalidateMerchandisingRoutes();
  redirect("/merchandising/plans?cycle_approved=1");
}
