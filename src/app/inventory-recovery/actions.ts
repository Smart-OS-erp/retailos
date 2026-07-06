"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

export async function runInventoryRecoveryIntelligence() {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.membership.role, "intelligence.run")) {
    redirect("/inventory-recovery?error=permission-denied");
  }

  const { data: runId, error } = await context.supabase.rpc(
    "run_inventory_recovery_intelligence",
    {},
  );
  if (error || !runId) {
    redirect("/inventory-recovery?error=run-failed");
  }

  revalidatePath("/inventory-recovery");
  revalidatePath("/inventory-recovery/skus");
  revalidatePath("/inventory-recovery/aging");
  revalidatePath("/inventory-recovery/categories");
  revalidatePath("/inventory-recovery/stores");
  revalidatePath("/attention-queue");
  redirect(`/inventory-recovery?run=${runId}`);
}
