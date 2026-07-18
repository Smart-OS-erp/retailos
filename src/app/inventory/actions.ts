"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission, type Permission } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

function readUuid(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function readInteger(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!/^-?\d+$/.test(text)) return null;
  return Number.parseInt(text, 10);
}

function readText(value: FormDataEntryValue | null, minLength = 3) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length >= minLength ? text : null;
}

function readIdempotencyKey(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length >= 8 ? text : `form-${randomUUID()}`;
}

function readCheckbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

async function requirePermission(permission: Permission, fallback = "/inventory") {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.membership.role, permission)) {
    redirect(`${fallback}?error=permission-denied`);
  }
  return context;
}

function revalidateInventoryRoutes(recordId?: string, kind?: "adjustment" | "transfer") {
  revalidatePath("/inventory");
  revalidatePath("/inventory/adjustments");
  revalidatePath("/inventory/transfers");
  revalidatePath("/inventory/counts");
  revalidatePath("/inventory/search");
  revalidatePath("/inventory/watchlist");
  revalidatePath("/inventory/movements");
  if (recordId && kind === "adjustment") {
    revalidatePath(`/inventory/adjustments/${recordId}`);
  }
  if (recordId && kind === "transfer") {
    revalidatePath(`/inventory/transfers/${recordId}`);
  }
}

export async function createStockAdjustment(formData: FormData) {
  const context = await requirePermission("inventory.manage", "/inventory/adjustments/new");
  const organizationId = String(formData.get("organizationId") ?? "");
  const locationId = readUuid(formData.get("locationId"));
  const skuId = readUuid(formData.get("skuId"));
  const quantityDelta = readInteger(formData.get("quantityDelta"));
  const reason = readText(formData.get("reason"));
  const itemReason = readText(formData.get("itemReason"), 0);

  if (organizationId !== context.membership.organization_id) {
    redirect("/inventory/adjustments/new?error=authorization");
  }
  if (!locationId || !skuId || !quantityDelta || !reason) {
    redirect("/inventory/adjustments/new?error=invalid-adjustment");
  }

  const { data: adjustmentId, error } = await context.supabase.rpc(
    "create_stock_adjustment",
    {
      target_items: [
        {
          quantity_delta: quantityDelta,
          reason: itemReason,
          sku_id: skuId,
        },
      ],
      target_location_id: locationId,
      target_reason: reason,
    },
  );

  if (error || !adjustmentId) {
    redirect("/inventory/adjustments/new?error=create-failed");
  }

  revalidateInventoryRoutes(adjustmentId, "adjustment");
  redirect(`/inventory/adjustments/${adjustmentId}?created=1`);
}

export async function approveStockAdjustment(formData: FormData) {
  const context = await requirePermission("inventory.manage", "/inventory/adjustments");
  const adjustmentId = readUuid(formData.get("adjustmentId"));
  if (!adjustmentId) redirect("/inventory/adjustments?error=invalid-adjustment");

  const { error } = await context.supabase.rpc("approve_stock_adjustment", {
    target_adjustment_id: adjustmentId,
  });
  if (error) redirect(`/inventory/adjustments/${adjustmentId}?error=approve-failed`);

  revalidateInventoryRoutes(adjustmentId, "adjustment");
  redirect(`/inventory/adjustments/${adjustmentId}?approved=1`);
}

export async function rejectStockAdjustment(formData: FormData) {
  const context = await requirePermission("inventory.manage", "/inventory/adjustments");
  const adjustmentId = readUuid(formData.get("adjustmentId"));
  const reason = readText(formData.get("rejectionReason"), 0);
  if (!adjustmentId) redirect("/inventory/adjustments?error=invalid-adjustment");

  const { error } = await context.supabase.rpc("reject_stock_adjustment", {
    target_adjustment_id: adjustmentId,
    target_rejection_reason: reason,
  });
  if (error) redirect(`/inventory/adjustments/${adjustmentId}?error=reject-failed`);

  revalidateInventoryRoutes(adjustmentId, "adjustment");
  redirect(`/inventory/adjustments/${adjustmentId}?rejected=1`);
}

export async function executeStockAdjustment(formData: FormData) {
  const context = await requirePermission("inventory.manage", "/inventory/adjustments");
  const adjustmentId = readUuid(formData.get("adjustmentId"));
  const idempotencyKey = readIdempotencyKey(formData.get("idempotencyKey"));
  if (!adjustmentId) redirect("/inventory/adjustments?error=invalid-adjustment");

  const { error } = await context.supabase.rpc("execute_stock_adjustment", {
    target_adjustment_id: adjustmentId,
    target_idempotency_key: idempotencyKey,
  });
  if (error) redirect(`/inventory/adjustments/${adjustmentId}?error=execute-failed`);

  revalidateInventoryRoutes(adjustmentId, "adjustment");
  redirect(`/inventory/adjustments/${adjustmentId}?executed=1`);
}

export async function reverseStockAdjustment(formData: FormData) {
  const context = await requirePermission("inventory.manage", "/inventory/adjustments");
  const adjustmentId = readUuid(formData.get("adjustmentId"));
  const reason = readText(formData.get("reversalReason"));
  const idempotencyKey = readIdempotencyKey(formData.get("idempotencyKey"));
  if (!adjustmentId || !reason) {
    redirect("/inventory/adjustments?error=invalid-adjustment");
  }

  const { error } = await context.supabase.rpc("reverse_stock_adjustment", {
    target_adjustment_id: adjustmentId,
    target_idempotency_key: idempotencyKey,
    target_reversal_reason: reason,
  });
  if (error) redirect(`/inventory/adjustments/${adjustmentId}?error=reverse-failed`);

  revalidateInventoryRoutes(adjustmentId, "adjustment");
  redirect(`/inventory/adjustments/${adjustmentId}?reversed=1`);
}

export async function createTransferRequest(formData: FormData) {
  const context = await requirePermission("transfer.manage", "/inventory/transfers/new");
  const organizationId = String(formData.get("organizationId") ?? "");
  const originLocationId = readUuid(formData.get("originLocationId"));
  const destinationLocationId = readUuid(formData.get("destinationLocationId"));
  const skuId = readUuid(formData.get("skuId"));
  const quantity = readInteger(formData.get("quantity"));
  const reason = readText(formData.get("reason"));

  if (organizationId !== context.membership.organization_id) {
    redirect("/inventory/transfers/new?error=authorization");
  }
  if (
    !originLocationId ||
    !destinationLocationId ||
    !skuId ||
    !quantity ||
    quantity <= 0 ||
    !reason
  ) {
    redirect("/inventory/transfers/new?error=invalid-transfer");
  }

  const { data: transferId, error } = await context.supabase.rpc(
    "create_transfer_request",
    {
      destination_location_id: destinationLocationId,
      origin_location_id: originLocationId,
      target_items: [{ quantity, sku_id: skuId }],
      target_reason: reason,
    },
  );

  if (error || !transferId) redirect("/inventory/transfers/new?error=create-failed");

  revalidateInventoryRoutes(transferId, "transfer");
  redirect(`/inventory/transfers/${transferId}?created=1`);
}

export async function approveTransferRequest(formData: FormData) {
  const context = await requirePermission("transfer.manage", "/inventory/transfers");
  const transferId = readUuid(formData.get("transferId"));
  if (!transferId) redirect("/inventory/transfers?error=invalid-transfer");

  const { error } = await context.supabase.rpc("approve_transfer_request", {
    target_transfer_id: transferId,
  });
  if (error) redirect(`/inventory/transfers/${transferId}?error=approve-failed`);

  revalidateInventoryRoutes(transferId, "transfer");
  redirect(`/inventory/transfers/${transferId}?approved=1`);
}

export async function rejectTransferRequest(formData: FormData) {
  const context = await requirePermission("transfer.manage", "/inventory/transfers");
  const transferId = readUuid(formData.get("transferId"));
  const reason = readText(formData.get("rejectionReason"), 0);
  if (!transferId) redirect("/inventory/transfers?error=invalid-transfer");

  const { error } = await context.supabase.rpc("reject_transfer_request", {
    target_rejection_reason: reason,
    target_transfer_id: transferId,
  });
  if (error) redirect(`/inventory/transfers/${transferId}?error=reject-failed`);

  revalidateInventoryRoutes(transferId, "transfer");
  redirect(`/inventory/transfers/${transferId}?rejected=1`);
}

export async function dispatchTransferRequest(formData: FormData) {
  const context = await requirePermission("transfer.manage", "/inventory/transfers");
  const transferId = readUuid(formData.get("transferId"));
  const idempotencyKey = readIdempotencyKey(formData.get("idempotencyKey"));
  if (!transferId) redirect("/inventory/transfers?error=invalid-transfer");

  const { error } = await context.supabase.rpc("dispatch_transfer_request", {
    target_idempotency_key: idempotencyKey,
    target_transfer_id: transferId,
  });
  if (error) redirect(`/inventory/transfers/${transferId}?error=dispatch-failed`);

  revalidateInventoryRoutes(transferId, "transfer");
  redirect(`/inventory/transfers/${transferId}?dispatched=1`);
}

export async function receiveTransferRequest(formData: FormData) {
  const context = await requirePermission("transfer.manage", "/inventory/transfers");
  const transferId = readUuid(formData.get("transferId"));
  const transferItemId = readUuid(formData.get("transferItemId"));
  const receivedQuantity = readInteger(formData.get("receivedQuantity"));
  const damagedQuantity = readInteger(formData.get("damagedQuantity")) ?? 0;
  const idempotencyKey = readIdempotencyKey(formData.get("idempotencyKey"));

  if (
    !transferId ||
    !transferItemId ||
    receivedQuantity === null ||
    receivedQuantity < 0 ||
    damagedQuantity < 0 ||
    receivedQuantity + damagedQuantity <= 0
  ) {
    redirect("/inventory/transfers?error=invalid-receipt");
  }

  const { error } = await context.supabase.rpc("receive_transfer_request", {
    target_idempotency_key: idempotencyKey,
    target_receipts: [
      {
        damaged_quantity: damagedQuantity,
        received_quantity: receivedQuantity,
        transfer_item_id: transferItemId,
      },
    ],
    target_transfer_id: transferId,
  });
  if (error) redirect(`/inventory/transfers/${transferId}?error=receive-failed`);

  revalidateInventoryRoutes(transferId, "transfer");
  redirect(`/inventory/transfers/${transferId}?received=1`);
}

export async function submitStockCount(formData: FormData) {
  const context = await requirePermission("stock_count.manage", "/inventory/counts/new");
  const organizationId = String(formData.get("organizationId") ?? "");
  const positionKey = String(formData.get("positionKey") ?? "");
  const [positionLocationId, positionSkuId, positionExpectedQuantity] =
    positionKey.split(":");
  const locationId =
    readUuid(formData.get("locationId")) ?? readUuid(positionLocationId ?? null);
  const skuId = readUuid(formData.get("skuId")) ?? readUuid(positionSkuId ?? null);
  const expectedQuantity =
    readInteger(formData.get("expectedQuantity")) ??
    readInteger(positionExpectedQuantity ?? null);
  const countedQuantity = readInteger(formData.get("countedQuantity"));

  if (organizationId !== context.membership.organization_id) {
    redirect("/inventory/counts/new?error=authorization");
  }
  if (
    !locationId ||
    !skuId ||
    expectedQuantity === null ||
    expectedQuantity < 0 ||
    countedQuantity === null ||
    countedQuantity < 0
  ) {
    redirect("/inventory/counts/new?error=invalid-count");
  }

  const { data: countId, error } = await context.supabase.rpc(
    "submit_stock_count",
    {
      target_counted_at: new Date().toISOString(),
      target_items: [
        {
          counted_quantity: countedQuantity,
          expected_quantity: expectedQuantity,
          sku_id: skuId,
        },
      ],
      target_location_id: locationId,
    },
  );

  if (error || !countId) {
    redirect("/inventory/counts/new?error=create-failed");
  }

  revalidateInventoryRoutes();
  revalidatePath(`/inventory/counts/${countId}`);
  redirect(`/inventory/counts/${countId}?created=1`);
}

export async function reviewStockCount(formData: FormData) {
  const context = await requirePermission("stock_count.manage", "/inventory/counts");
  const countId = readUuid(formData.get("countId"));
  const notes = readText(formData.get("reviewNotes"), 0);

  if (!countId) redirect("/inventory/counts?error=invalid-count");

  const { error } = await context.supabase.rpc("review_stock_count", {
    target_review_notes: notes,
    target_stock_count_id: countId,
  });
  if (error) redirect(`/inventory/counts/${countId}?error=review-failed`);

  revalidateInventoryRoutes();
  revalidatePath(`/inventory/counts/${countId}`);
  redirect(`/inventory/counts/${countId}?reviewed=1`);
}

export async function closeStockCount(formData: FormData) {
  const context = await requirePermission("stock_count.manage", "/inventory/counts");
  const countId = readUuid(formData.get("countId"));
  const idempotencyKey = readIdempotencyKey(formData.get("idempotencyKey"));
  const createCorrections = readCheckbox(formData.get("createCorrections"));
  const closureNotes = readText(formData.get("closureNotes"), 0);
  const issueIds = formData.getAll("issueId");
  const issueStatuses = formData.getAll("issueStatus");
  const issueNotes = formData.getAll("resolutionNote");

  if (!countId) redirect("/inventory/counts?error=invalid-count");

  const decisions = issueIds.map((rawIssueId, index) => {
    const issueId = readUuid(rawIssueId);
    const status = String(issueStatuses[index] ?? "");
    const resolutionNote = readText(issueNotes[index] ?? null, 0);
    if (!issueId || !["resolved", "dismissed"].includes(status)) {
      return null;
    }
    return {
      issue_id: issueId,
      resolution_note: resolutionNote,
      status,
    };
  });

  if (decisions.some((decision) => decision === null)) {
    redirect(`/inventory/counts/${countId}?error=invalid-issue-decision`);
  }

  const { error } = await context.supabase.rpc("close_stock_count", {
    target_closure_notes: closureNotes,
    target_create_corrections: createCorrections,
    target_idempotency_key: idempotencyKey,
    target_issue_decisions: decisions,
    target_stock_count_id: countId,
  });
  if (error) redirect(`/inventory/counts/${countId}?error=close-failed`);

  revalidateInventoryRoutes();
  revalidatePath(`/inventory/counts/${countId}`);
  redirect(`/inventory/counts/${countId}?closed=1`);
}
