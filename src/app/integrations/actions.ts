"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { runProviderSyncAfterEnqueue } from "@/lib/integrations/provider-sync";
import type { IntegrationConnectorDepth } from "@/types/database";

const allowedReturnPaths = new Set([
  "/integrations",
  "/onboarding/data-source",
]);

function safeReturnPath(formData: FormData) {
  const requested = String(formData.get("returnPath") ?? "/integrations");
  return allowedReturnPaths.has(requested) ? requested : "/integrations";
}

function redirectWithError(path: string, code: string): never {
  redirect(`${path}?error=${encodeURIComponent(code)}`);
}

function validProviderKey(value: string) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(value);
}

function readConnectorDepth(value: FormDataEntryValue | null) {
  if (!value) return null;
  const depth = String(value);
  if (["manual", "scaffold", "mvp", "api"].includes(depth)) {
    return depth as IntegrationConnectorDepth;
  }
  return null;
}

export async function createIntegrationDataSource(formData: FormData) {
  const returnPath = safeReturnPath(formData);
  const context = await requireOrganizationContext();
  const submittedOrganizationId = String(formData.get("organizationId") ?? "");
  const providerKey = String(formData.get("providerKey") ?? "").trim();
  const name = String(formData.get("dataSourceName") ?? "").trim();
  const requestedConnectorDepth = readConnectorDepth(
    formData.get("requestedConnectorDepth"),
  );

  if (submittedOrganizationId !== context.membership.organization_id) {
    redirectWithError(returnPath, "authorization");
  }

  if (!hasPermission(context.membership.role, "integration.manage")) {
    redirectWithError(returnPath, "permission-denied");
  }

  if (
    !validProviderKey(providerKey)
    || name.length < 2
    || name.length > 120
  ) {
    redirectWithError(returnPath, "invalid-source");
  }

  const { data: sourceId, error } = await context.supabase.rpc(
    "create_data_source",
    {
      requested_connector_depth: requestedConnectorDepth,
      target_name: name,
      target_organization_id: context.membership.organization_id,
      target_provider_key: providerKey,
    },
  );

  if (error || !sourceId) {
    const code = error?.message === "unsupported_provider"
      ? "unsupported-provider"
      : error?.message === "provider_mvp_not_approved"
        ? "connector-depth"
        : error?.message === "invalid_data_source_name"
          ? "invalid-source"
          : error?.code === "23505"
            ? "duplicate-source"
            : "create-failed";
    redirectWithError(returnPath, code);
  }

  revalidatePath("/integrations");
  revalidatePath("/onboarding/data-source");
  redirect(`${returnPath}?created=1`);
}

export async function requestDataSourceSync(formData: FormData) {
  const returnPath = safeReturnPath(formData);
  const context = await requireOrganizationContext();
  const submittedOrganizationId = String(formData.get("organizationId") ?? "");
  const dataSourceId = String(formData.get("dataSourceId") ?? "").trim();

  if (submittedOrganizationId !== context.membership.organization_id) {
    redirectWithError(returnPath, "authorization");
  }

  if (!hasPermission(context.membership.role, "integration.sync")) {
    redirectWithError(returnPath, "permission-denied");
  }

  if (
    !hasPermission(context.membership.role, "integration.import")
    || !hasPermission(context.membership.role, "data.manage")
  ) {
    redirectWithError(returnPath, "permission-denied");
  }

  if (!/^[0-9a-f-]{36}$/i.test(dataSourceId)) {
    redirectWithError(returnPath, "invalid-source");
  }

  const { data: jobId, error } = await context.supabase.rpc(
    "enqueue_data_source_sync",
    {
      target_data_source_id: dataSourceId,
      target_idempotency_key: `manual-${randomUUID()}`,
    },
  );

  if (error || !jobId) {
    redirectWithError(returnPath, "sync-failed");
  }

  try {
    await runProviderSyncAfterEnqueue({
      jobId,
      organizationId: context.membership.organization_id,
      normalizeExternalRecords: async (targetSyncJobId) => {
        const { error: normalizationError } = await context.supabase.rpc(
          "normalize_external_records",
          {
            target_sync_job_id: targetSyncJobId,
          },
        );

        return {
          error: normalizationError
            ? {
                code: normalizationError.code,
                message: normalizationError.message,
              }
            : null,
        };
      },
    });
  } catch {
    redirectWithError(returnPath, "sync-failed");
  }

  revalidatePath("/integrations");
  revalidatePath("/onboarding/data-source");
  redirect(`${returnPath}?sync=requested`);
}
