import Link from "next/link";

import { RoleWorkspacePage } from "@/components/role-workspace-page";

export default function MerchandisingWorkspacePage() {
  return (
    <RoleWorkspacePage
      allowedRoles={["merchandising_manager"]}
      description="A merchandising command surface for data readiness, consolidation, inventory risk, and projectisation workflows."
      eyebrow="Merchandising workspace"
      title="Turn inventory risk into commercial action"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [
          uploadsResult,
          issuesResult,
          runsResult,
          opportunitiesResult,
          projectsResult,
        ] = await Promise.all([
          context.supabase
            .from("data_uploads")
            .select("id, file_name, status, row_count, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(5),
          context.supabase
            .from("validation_issues")
            .select("id, severity, issue_code, message, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(5),
          context.supabase
            .from("consolidation_runs")
            .select("id, status, inserted_count, updated_count, excluded_count, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(5),
          context.supabase
            .from("recovery_opportunities")
            .select("id, title, attention_priority_band, status")
            .eq("organization_id", organizationId)
            .eq("status", "open")
            .order("attention_priority_score", { ascending: false })
            .limit(5),
          context.supabase
            .from("recovery_projects")
            .select("id, name, status, updated_at")
            .eq("organization_id", organizationId)
            .order("updated_at", { ascending: false })
            .limit(5),
        ]);

        const uploads = uploadsResult.data ?? [];
        const issues = issuesResult.data ?? [];
        const runs = runsResult.data ?? [];
        const opportunities = opportunitiesResult.data ?? [];
        const projects = projectsResult.data ?? [];
        const blockingIssues = issues.filter(
          (issue) => issue.severity === "blocking",
        ).length;

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Merchandising workflow state">
              <article className="summary-card">
                <span>Recent uploads</span>
                <strong>{uploads.length}</strong>
              </article>
              <article className="summary-card">
                <span>Blocking issues</span>
                <strong>{blockingIssues}</strong>
              </article>
              <article className="summary-card">
                <span>Open opportunities</span>
                <strong>{opportunities.length}</strong>
              </article>
            </section>

            <section className="panel">
              <div className="data-toolbar">
                <div>
                  <h2>Data readiness</h2>
                  <p className="muted">
                    Uploads must be parsed, validated, and approved before they
                    become operating evidence.
                  </p>
                </div>
                <Link className="button button-primary" href="/data">
                  Open Data Foundation
                </Link>
              </div>
              {uploads.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Status</th>
                        <th>Rows</th>
                        <th>Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploads.map((upload) => (
                        <tr key={upload.id}>
                          <td>{upload.file_name}</td>
                          <td>
                            <span className="status-badge">
                              {upload.status.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td>{upload.row_count.toLocaleString("en-NG")}</td>
                          <td>{new Date(upload.created_at).toLocaleString("en-NG")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No upload is visible yet.</p>
              )}
            </section>

            <section className="panel">
              <div className="data-toolbar">
                <div>
                  <h2>Consolidation and recovery</h2>
                  <p className="muted">
                    Move from approved evidence into operating view, recovery
                    opportunities, and projectisation.
                  </p>
                </div>
                <div className="actions">
                  <Link className="button button-secondary" href="/consolidation">
                    Consolidation Hub
                  </Link>
                  <Link className="button button-secondary" href="/attention-queue">
                    Attention Queue
                  </Link>
                </div>
              </div>
              <dl className="definition">
                <div>
                  <dt>Latest consolidation runs</dt>
                  <dd>{runs.length}</dd>
                </div>
                <div>
                  <dt>Active projects</dt>
                  <dd>
                    {
                      projects.filter(
                        (project) =>
                          !["completed", "cancelled"].includes(project.status),
                      ).length
                    }
                  </dd>
                </div>
              </dl>
            </section>

            <section className="panel">
              <h2>Merchandising action queue</h2>
              {opportunities.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Opportunity</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((opportunity) => (
                        <tr key={opportunity.id}>
                          <td>
                            <Link href={`/projectisation/opportunities/${opportunity.id}`}>
                              {opportunity.title}
                            </Link>
                          </td>
                          <td>
                            <span className="status-badge">
                              {opportunity.attention_priority_band}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">
                  No open opportunity is currently visible.
                </p>
              )}
            </section>
          </div>
        );
      }}
    </RoleWorkspacePage>
  );
}
