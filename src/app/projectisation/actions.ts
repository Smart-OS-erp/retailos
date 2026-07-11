"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission, type Permission } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

function readUuid(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function readVersion(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value : "";
  const parsed = Number.parseInt(text, 10);
  return /^\d+$/.test(text) && parsed > 0 ? parsed : null;
}

async function requirePermission(permission: Permission) {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.membership.role, permission)) {
    redirect("/projectisation?error=permission-denied");
  }
  return context;
}

function refreshProjectSurfaces(projectId?: string) {
  revalidatePath("/projectisation");
  revalidatePath("/projectisation/approvals");
  revalidatePath("/projectisation/completed");
  revalidatePath("/tasks");
  if (projectId) revalidatePath(`/projectisation/projects/${projectId}`);
}

export async function createRecoveryProject(formData: FormData) {
  const context = await requirePermission("project.manage");
  const opportunityId = readUuid(formData.get("opportunityId"));
  if (!opportunityId) redirect("/projectisation?error=invalid-opportunity");
  const organizationId = context.membership.organization_id;
  const { data: opportunity } = await context.supabase
    .from("recovery_opportunities")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", opportunityId)
    .maybeSingle();
  if (!opportunity) redirect("/projectisation?error=opportunity-not-found");

  const { data: projectId, error } = await context.supabase.rpc(
    "create_recovery_project",
    { target_opportunity_id: opportunity.id },
  );
  if (error || !projectId) redirect(`/projectisation/opportunities/${opportunity.id}?error=create-failed`);

  refreshProjectSurfaces(projectId);
  revalidatePath("/attention-queue");
  redirect(`/projectisation/projects/${projectId}`);
}

export async function submitRecoveryProject(formData: FormData) {
  const context = await requirePermission("project.manage");
  const projectId = readUuid(formData.get("projectId"));
  const version = readVersion(formData.get("version"));
  if (!projectId || !version) redirect("/projectisation?error=invalid-project");
  const organizationId = context.membership.organization_id;
  const { data: project } = await context.supabase
    .from("recovery_projects")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();
  if (!project) redirect("/projectisation?error=project-not-found");

  const { error } = await context.supabase.rpc("submit_recovery_project", {
    target_project_id: project.id,
    expected_version: version,
  });
  if (error) redirect(`/projectisation/projects/${project.id}?error=submit-failed`);

  refreshProjectSurfaces(project.id);
  redirect(`/projectisation/projects/${project.id}?submitted=true`);
}

export async function approveRecoveryProject(formData: FormData) {
  const context = await requirePermission("project.approve");
  const projectId = readUuid(formData.get("projectId"));
  const version = readVersion(formData.get("version"));
  if (!projectId || !version) redirect("/projectisation/approvals?error=invalid-project");
  const organizationId = context.membership.organization_id;
  const { data: project } = await context.supabase
    .from("recovery_projects")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();
  if (!project) redirect("/projectisation/approvals?error=project-not-found");

  const { error } = await context.supabase.rpc("approve_recovery_project", {
    target_project_id: project.id,
    expected_version: version,
  });
  if (error) redirect(`/projectisation/projects/${project.id}?error=approval-failed`);

  refreshProjectSurfaces(project.id);
  redirect(`/projectisation/projects/${project.id}?approved=true`);
}

export async function approveCampaignBrief(formData: FormData) {
  const context = await requirePermission("campaign_brief.approve");
  const briefId = readUuid(formData.get("briefId"));
  const version = readVersion(formData.get("version"));
  if (!briefId || !version) redirect("/projectisation/approvals?error=invalid-brief");
  const organizationId = context.membership.organization_id;
  const { data: brief } = await context.supabase
    .from("campaign_briefs")
    .select("id, recovery_project_id")
    .eq("organization_id", organizationId)
    .eq("id", briefId)
    .maybeSingle();
  if (!brief) redirect("/projectisation/approvals?error=brief-not-found");

  const { error } = await context.supabase.rpc("approve_campaign_brief", {
    target_brief_id: brief.id,
    expected_version: version,
  });
  if (error) redirect(`/projectisation/campaign-briefs/${brief.id}?error=approval-failed`);

  refreshProjectSurfaces(brief.recovery_project_id);
  revalidatePath(`/projectisation/campaign-briefs/${brief.id}`);
  redirect(`/projectisation/campaign-briefs/${brief.id}?approved=true`);
}

export async function setTaskStatus(formData: FormData) {
  const context = await requirePermission("task.manage");
  const taskId = readUuid(formData.get("taskId"));
  const version = readVersion(formData.get("version"));
  const status = formData.get("status");
  if (
    !taskId ||
    !version ||
    (status !== "in_progress" && status !== "completed")
  ) {
    redirect("/tasks?error=invalid-task");
  }
  const organizationId = context.membership.organization_id;
  const { data: task } = await context.supabase
    .from("recovery_project_tasks")
    .select("id, recovery_project_id")
    .eq("organization_id", organizationId)
    .eq("id", taskId)
    .maybeSingle();
  if (!task) redirect("/tasks?error=task-not-found");

  const { error } = await context.supabase.rpc("set_recovery_task_status", {
    target_task_id: task.id,
    expected_version: version,
    target_status: status,
  });
  if (error) redirect("/tasks?error=transition-failed");

  refreshProjectSurfaces(task.recovery_project_id);
  redirect("/tasks?updated=true");
}
