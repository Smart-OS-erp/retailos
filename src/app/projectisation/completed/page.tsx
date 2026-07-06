import Link from "next/link";

import { ProjectPage } from "@/components/project-page";

export default function CompletedProjectsPage() {
  return (
    <ProjectPage
      description="Completed internal recovery workflows with their original evidence version and completion timestamp."
      title="Completed projects"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const { data: projects } = await context.supabase
          .from("recovery_projects")
          .select("id, name, evidence_version, completed_at")
          .eq("organization_id", organizationId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false });

        return (
          <section className="panel">
            {projects?.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Project</th><th>Evidence</th><th>Completed</th></tr></thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td><Link href={`/projectisation/projects/${project.id}`}>{project.name}</Link></td>
                        <td>{project.evidence_version}</td>
                        <td>{project.completed_at ? new Date(project.completed_at).toLocaleString("en-NG") : "Unknown"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No recovery project is complete.</p>
            )}
          </section>
        );
      }}
    </ProjectPage>
  );
}
