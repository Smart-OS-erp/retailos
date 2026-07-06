import Link from "next/link";

import { ProjectPage } from "@/components/project-page";
import { Notice } from "@/components/notice";

type ApprovalsPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ApprovalsPage({
  searchParams,
}: ApprovalsPageProps) {
  const { error } = await searchParams;

  return (
    <ProjectPage
      description="Independent approvers review immutable evidence versions. Self, stale, replayed, and unauthorized approvals fail closed."
      title="Approval queue"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [projectsResult, briefsResult] = await Promise.all([
          context.supabase
            .from("recovery_projects")
            .select("id, name, version, created_by, evidence_version")
            .eq("organization_id", organizationId)
            .eq("status", "pending_approval")
            .order("submitted_at"),
          context.supabase
            .from("campaign_briefs")
            .select("id, recovery_project_id, version, created_by, evidence_version")
            .eq("organization_id", organizationId)
            .eq("status", "pending_approval")
            .order("created_at"),
        ]);

        return (
          <div className="content-grid">
            {error ? (
              <Notice title="Approval unavailable" tone="error">
                The request failed its permission, version, state, or separation-of-duties check.
              </Notice>
            ) : null}
            <section className="panel">
              <h2>Projects awaiting approval</h2>
              {projectsResult.data?.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Project</th><th>Version</th><th>Evidence</th><th>Separation</th></tr></thead>
                    <tbody>
                      {projectsResult.data.map((project) => (
                        <tr key={project.id}>
                          <td><Link href={`/projectisation/projects/${project.id}`}>{project.name}</Link></td>
                          <td>{project.version}</td>
                          <td>{project.evidence_version}</td>
                          <td>{project.created_by === context.user.id ? "Self-approval blocked" : "Independent review available"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No project is awaiting approval.</p>
              )}
            </section>
            <section className="panel">
              <h2>Campaign briefs awaiting approval</h2>
              {briefsResult.data?.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Brief</th><th>Version</th><th>Evidence</th><th>Separation</th></tr></thead>
                    <tbody>
                      {briefsResult.data.map((brief) => (
                        <tr key={brief.id}>
                          <td><Link href={`/projectisation/campaign-briefs/${brief.id}`}>Open brief</Link></td>
                          <td>{brief.version}</td>
                          <td>{brief.evidence_version}</td>
                          <td>{brief.created_by === context.user.id ? "Self-approval blocked" : "Independent review available"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No campaign brief is awaiting approval.</p>
              )}
            </section>
          </div>
        );
      }}
    </ProjectPage>
  );
}
