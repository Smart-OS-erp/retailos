import Link from "next/link";

import { ProjectPage } from "@/components/project-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";

import { setTaskStatus } from "../projectisation/actions";

type TasksPageProps = {
  searchParams: Promise<{ error?: string; updated?: string }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const state = await searchParams;

  return (
    <ProjectPage
      description="Internal execution tracking for approved recovery projects. Store managers see assigned locations only."
      title="Recovery tasks"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const { data: tasks } = await context.supabase
          .from("recovery_project_tasks")
          .select("id, recovery_project_id, title, status, version, location_id, created_at")
          .eq("organization_id", organizationId)
          .order("created_at");
        const canManage = hasPermission(context.membership.role, "task.manage");

        return (
          <div className="content-grid">
            {state.error ? (
              <Notice title="Task transition denied" tone="error">
                The task version, project state, role, or location assignment did not match.
              </Notice>
            ) : state.updated ? (
              <Notice title="Task updated" tone="success">
                The internal execution state was recorded.
              </Notice>
            ) : null}
            <section className="panel">
              {tasks?.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Task</th><th>Status</th><th>Version</th><th>Project</th><th>Action</th></tr></thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.title}</td>
                          <td><span className="status-badge">{task.status.replaceAll("_", " ")}</span></td>
                          <td>{task.version}</td>
                          <td><Link href={`/projectisation/projects/${task.recovery_project_id}`}>Open project</Link></td>
                          <td>
                            {canManage && task.status !== "completed" ? (
                              <form action={setTaskStatus}>
                                <input name="taskId" type="hidden" value={task.id} />
                                <input name="version" type="hidden" value={task.version} />
                                <input
                                  name="status"
                                  type="hidden"
                                  value={task.status === "pending" ? "in_progress" : "completed"}
                                />
                                <button className="button button-secondary" type="submit">
                                  {task.status === "pending" ? "Start" : "Complete"}
                                </button>
                              </form>
                            ) : (
                              <span className="muted">Read only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No project task is visible.</p>
              )}
            </section>
          </div>
        );
      }}
    </ProjectPage>
  );
}
