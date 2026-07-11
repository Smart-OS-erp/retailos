import Link from "next/link";

import { ProjectPage } from "@/components/project-page";
import { Notice } from "@/components/notice";

type ProjectisationPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ProjectisationPage({
  searchParams,
}: ProjectisationPageProps) {
  const { error } = await searchParams;

  return (
    <ProjectPage
      description="Turn supported recovery opportunities into approval-bound internal projects, tasks, and campaign briefs."
      title="Recovery projects"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [projectsResult, itemsResult] = await Promise.all([
          context.supabase
            .from("recovery_projects")
            .select("id, name, status, location_id, version, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false }),
          context.supabase
            .from("recovery_project_skus")
            .select("recovery_project_id, quantity, approved_unit_cost, currency_code")
            .eq("organization_id", organizationId),
        ]);
        const projects = projectsResult.data ?? [];
        const active = projects.filter(
          (project) => !["completed", "cancelled"].includes(project.status),
        ).length;
        const pending = projects.filter(
          (project) => project.status === "pending_approval",
        ).length;
        const values = new Map<string, number>();
        for (const item of itemsResult.data ?? []) {
          if (item.approved_unit_cost === null || !item.currency_code) continue;
          values.set(
            item.currency_code,
            (values.get(item.currency_code) ?? 0) +
              item.quantity * item.approved_unit_cost,
          );
        }

        return (
          <div className="content-grid">
            {error ? (
              <Notice title="Project action unavailable" tone="error">
                The request failed closed. Recheck permission, evidence version, and workflow state.
              </Notice>
            ) : null}
            <section className="summary-grid" aria-label="Live project status">
              <article className="summary-card"><span>Active projects</span><strong>{active}</strong></article>
              <article className="summary-card"><span>Awaiting approval</span><strong>{pending}</strong></article>
              <article className="summary-card"><span>Completed</span><strong>{projects.filter((project) => project.status === "completed").length}</strong></article>
            </section>
            <section className="panel">
              <h2>Dead Stock Value Projectised</h2>
              {values.size ? (
                <dl className="definition">
                  {[...values.entries()].sort().map(([currency, value]) => (
                    <div key={currency}><dt>{currency}</dt><dd>{value.toLocaleString("en-NG")}</dd></div>
                  ))}
                </dl>
              ) : (
                <p className="empty-state">No approved-cost project items are visible.</p>
              )}
              <p className="muted">Currencies remain separate. RetailOS performs no Phase 0 FX conversion.</p>
            </section>
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/attention-queue">Open opportunities</Link>
                <Link className="button button-secondary" href="/projectisation/approvals">Approvals</Link>
                <Link className="button button-secondary" href="/tasks">Tasks</Link>
                <Link className="button button-secondary" href="/projectisation/completed">Completed</Link>
              </div>
              {projects.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Project</th><th>Status</th><th>Version</th><th>Created</th></tr></thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id}>
                          <td><Link href={`/projectisation/projects/${project.id}`}>{project.name}</Link></td>
                          <td><span className="status-badge">{project.status.replaceAll("_", " ")}</span></td>
                          <td>{project.version}</td>
                          <td>{new Date(project.created_at).toLocaleString("en-NG")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No opportunity has been projectised.</p>
              )}
            </section>
          </div>
        );
      }}
    </ProjectPage>
  );
}
