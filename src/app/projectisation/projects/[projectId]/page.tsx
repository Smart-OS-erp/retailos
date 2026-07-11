import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectPage } from "@/components/project-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";

import {
  approveRecoveryProject,
  submitRecoveryProject,
} from "../../actions";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ approved?: string; error?: string; submitted?: string }>;
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  const state = await searchParams;

  return (
    <ProjectPage
      description="Evidence, status, version, tasks, and approval history remain attached to one tenant and location."
      title="Recovery project"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [projectResult, itemsResult, tasksResult, briefResult, approvalsResult] =
          await Promise.all([
            context.supabase
              .from("recovery_projects")
              .select("id, name, status, version, evidence_version, created_by, submitted_at, approved_at, completed_at")
              .eq("organization_id", organizationId)
              .eq("id", projectId)
              .maybeSingle(),
            context.supabase
              .from("recovery_project_skus")
              .select("id, sku_id, quantity, approved_unit_cost, currency_code")
              .eq("organization_id", organizationId)
              .eq("recovery_project_id", projectId),
            context.supabase
              .from("recovery_project_tasks")
              .select("id, title, status, version")
              .eq("organization_id", organizationId)
              .eq("recovery_project_id", projectId)
              .order("created_at"),
            context.supabase
              .from("campaign_briefs")
              .select("id, status")
              .eq("organization_id", organizationId)
              .eq("recovery_project_id", projectId)
              .maybeSingle(),
            context.supabase
              .from("approval_records")
              .select("id, subject_type, subject_version, evidence_version, decided_at")
              .eq("organization_id", organizationId)
              .eq("recovery_project_id", projectId)
              .order("decided_at"),
          ]);
        if (!projectResult.data || projectResult.error) notFound();
        const project = projectResult.data;

        return (
          <div className="content-grid">
            {state.error ? (
              <Notice title="Transition denied" tone="error">
                The action failed closed because the version, role, self-approval rule, or current state did not match.
              </Notice>
            ) : state.submitted ? (
              <Notice title="Submitted for approval" tone="success">
                The project version is locked for an independent approver.
              </Notice>
            ) : state.approved ? (
              <Notice title="Project approved" tone="success">
                The approval record is immutable and evidence-bound.
              </Notice>
            ) : null}
            <section className="panel">
              <h2>{project.name}</h2>
              <dl className="definition">
                <div><dt>Status</dt><dd>{project.status.replaceAll("_", " ")}</dd></div>
                <div><dt>Workflow version</dt><dd>{project.version}</dd></div>
                <div><dt>Evidence version</dt><dd>{project.evidence_version}</dd></div>
                <div><dt>Project items</dt><dd>{itemsResult.data?.length ?? 0}</dd></div>
              </dl>
              <div className="actions">
                {project.status === "draft" &&
                hasPermission(context.membership.role, "project.manage") ? (
                  <form action={submitRecoveryProject}>
                    <input name="projectId" type="hidden" value={project.id} />
                    <input name="version" type="hidden" value={project.version} />
                    <button className="button button-primary" type="submit">Submit for approval</button>
                  </form>
                ) : null}
                {project.status === "pending_approval" &&
                hasPermission(context.membership.role, "project.approve") &&
                project.created_by !== context.user.id ? (
                  <form action={approveRecoveryProject}>
                    <input name="projectId" type="hidden" value={project.id} />
                    <input name="version" type="hidden" value={project.version} />
                    <button className="button button-primary" type="submit">Approve project</button>
                  </form>
                ) : null}
                {briefResult.data ? (
                  <Link className="button button-secondary" href={`/projectisation/campaign-briefs/${briefResult.data.id}`}>
                    Campaign brief · {briefResult.data.status.replaceAll("_", " ")}
                  </Link>
                ) : null}
              </div>
            </section>
            <section className="panel">
              <h2>Internal tasks</h2>
              {(tasksResult.data ?? []).map((task) => (
                <div
                  className={`status-row ${task.status === "completed" ? "status-complete" : ""}`}
                  key={task.id}
                >
                  <span className="status-dot" aria-hidden="true" />
                  <div><strong>{task.title}</strong><span>{task.status.replaceAll("_", " ")} · version {task.version}</span></div>
                </div>
              ))}
              <Link href="/tasks">Open task workspace</Link>
            </section>
            <section className="panel">
              <h2>Approval evidence</h2>
              {approvalsResult.data?.length ? (
                <dl className="definition">
                  {approvalsResult.data.map((approval) => (
                    <div key={approval.id}>
                      <dt>{approval.subject_type.replaceAll("_", " ")}</dt>
                      <dd>Version {approval.subject_version} · {approval.evidence_version}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="empty-state">No approval has been recorded.</p>
              )}
            </section>
          </div>
        );
      }}
    </ProjectPage>
  );
}
