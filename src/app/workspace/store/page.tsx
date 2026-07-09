import Link from "next/link";

import { RoleWorkspacePage } from "@/components/role-workspace-page";

export default function StoreWorkspacePage() {
  return (
    <RoleWorkspacePage
      allowedRoles={["store_manager"]}
      description="A mobile-first execution view for assigned-location inventory, recovery tasks, and safe next actions."
      eyebrow="Store manager workspace"
      title="Today’s store execution"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [inventoryResult, tasksResult, opportunitiesResult] =
          await Promise.all([
            context.supabase
              .from("current_inventory_positions")
              .select("id, sku_code, product_name, location_name, on_hand_quantity, approved_unit_cost, currency_code")
              .eq("organization_id", organizationId)
              .order("location_name")
              .limit(8),
            context.supabase
              .from("recovery_project_tasks")
              .select("id, recovery_project_id, title, status, version, updated_at")
              .eq("organization_id", organizationId)
              .order("updated_at", { ascending: false })
              .limit(8),
            context.supabase
              .from("recovery_opportunities")
              .select("id, title, attention_priority_band, estimated_value, currency_code")
              .eq("organization_id", organizationId)
              .eq("status", "open")
              .order("attention_priority_score", { ascending: false })
              .limit(5),
          ]);

        const inventory = inventoryResult.data ?? [];
        const tasks = tasksResult.data ?? [];
        const opportunities = opportunitiesResult.data ?? [];
        const openTasks = tasks.filter((task) => task.status !== "completed").length;

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Store execution state">
              <article className="summary-card">
                <span>Visible SKUs</span>
                <strong>{inventory.length}</strong>
              </article>
              <article className="summary-card">
                <span>Open tasks</span>
                <strong>{openTasks}</strong>
              </article>
              <article className="summary-card">
                <span>Recovery actions</span>
                <strong>{opportunities.length}</strong>
              </article>
            </section>

            <section className="panel">
              <div className="data-toolbar">
                <div>
                  <h2>Assigned-location tasks</h2>
                  <p className="muted">
                    Task updates remain versioned and permission checked in the
                    project workflow.
                  </p>
                </div>
                <Link className="button button-primary" href="/tasks">
                  Open task workspace
                </Link>
              </div>
              {tasks.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Project</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.title}</td>
                          <td>
                            <span className="status-badge">
                              {task.status.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td>
                            <Link href={`/projectisation/projects/${task.recovery_project_id}`}>
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No assigned task is currently visible.</p>
              )}
            </section>

            <section className="panel">
              <h2>Store inventory evidence</h2>
              {inventory.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product</th>
                        <th>Store</th>
                        <th>On hand</th>
                        <th>Approved cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((position) => (
                        <tr key={position.id}>
                          <td>{position.sku_code}</td>
                          <td>{position.product_name}</td>
                          <td>{position.location_name}</td>
                          <td>{position.on_hand_quantity}</td>
                          <td>
                            {position.approved_unit_cost === null
                              ? "Not available"
                              : `${position.approved_unit_cost.toLocaleString("en-NG")} ${position.currency_code ?? ""}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">
                  No assigned-location inventory is visible yet.
                </p>
              )}
            </section>

            <section className="panel">
              <h2>Recovery actions to inspect</h2>
              {opportunities.length ? (
                <div className="actions">
                  {opportunities.map((opportunity) => (
                    <Link
                      className="button button-secondary"
                      href={`/projectisation/opportunities/${opportunity.id}`}
                      key={opportunity.id}
                    >
                      {opportunity.attention_priority_band}: {opportunity.title}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="empty-state">
                  No recovery opportunity is visible for assigned locations.
                </p>
              )}
            </section>
          </div>
        );
      }}
    </RoleWorkspacePage>
  );
}
