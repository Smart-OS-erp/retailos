"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

function readUuid(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

async function requireManagedUpload(formData: FormData) {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.membership.role, "data.manage")) {
    redirect("/consolidation?error=permission-denied");
  }
  const uploadId = readUuid(formData.get("uploadId"));
  if (!uploadId) redirect("/consolidation?error=invalid-upload");
  const organizationId = context.membership.organization_id;
  const { data: upload, error } = await context.supabase
    .from("data_uploads")
    .select("id, content_sha256, status")
    .eq("organization_id", organizationId)
    .eq("id", uploadId)
    .maybeSingle();
  if (error || !upload) redirect("/consolidation?error=upload-not-found");

  return { context, organizationId, upload };
}

export async function acceptUploadWarnings(formData: FormData) {
  const { context, upload } = await requireManagedUpload(formData);
  const { error } = await context.supabase.rpc(
    "accept_inventory_upload_warnings",
    { target_upload_id: upload.id },
  );
  if (error) redirect(`/data/uploads/${upload.id}?error=warning-approval-failed`);

  revalidatePath("/data");
  revalidatePath(`/data/uploads/${upload.id}`);
  revalidatePath("/consolidation");
  redirect(`/data/uploads/${upload.id}?accepted=warnings`);
}

export async function consolidateUpload(formData: FormData) {
  const { context, upload } = await requireManagedUpload(formData);
  const suppliedDigest = formData.get("contentSha256");
  if (
    typeof suppliedDigest !== "string" ||
    !/^[a-f0-9]{64}$/.test(suppliedDigest) ||
    suppliedDigest !== upload.content_sha256
  ) {
    redirect(`/data/uploads/${upload.id}?error=source-changed`);
  }

  const { data: runId, error } = await context.supabase.rpc(
    "consolidate_inventory_upload",
    {
      target_upload_id: upload.id,
      expected_content_sha256: suppliedDigest,
    },
  );
  if (error || !runId) {
    redirect(`/data/uploads/${upload.id}?error=consolidation-failed`);
  }

  revalidatePath("/data");
  revalidatePath("/consolidation");
  revalidatePath("/consolidation/operating-view");
  redirect(`/consolidation?run=${runId}`);
}
