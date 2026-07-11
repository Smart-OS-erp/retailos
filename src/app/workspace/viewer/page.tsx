import Link from "next/link";

import { RoleWorkspacePage } from "@/components/role-workspace-page";

export default function ViewerWorkspacePage() {
  return (
    <RoleWorkspacePage
      allowedRoles={["viewer"]}
      description="Read-only access to the organization evidence you are allowed to see. Viewer workflows do not expose mutation actions."
      eyebrow="Viewer workspace"
      title="Review trusted retail evidence"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [inventoryResult, opportunitiesResult, projectsResult] =
          await Promise.all([
            context.supabase
              .from("current_inventory_positions")
              .select("id, sku_code, product_name, location_name, on_hand_quantity")
              .eq("organization_id", organizationId)
              .order("location_name")
              .limit(6),
            context.supabase
              .from("recovery_opportunities")
              .select("id, title, attention_priority_band, status")
              .eq("organization_id", organizationId)
              .order("created_at", { ascending: false })
              .limit(6),
            context.supabase
              .from("recovery_projects")
              .select("id, name, status, updated_at")
              .eq("organization_id", organizationId)
              .order("updated_at", { ascending: false })
              .limit(6),
          ]);

        const inventory = inventoryResult.data ?? [];
        const opportunities = opportunitiesResult.data ?? [];
        const projects = projectsResult.data ?? [];

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Viewer evidence state">
              <article className="summary-card">
                <span>Inventory records</span>
                <strong>{inventory.length}</strong>
              </article>
              <article className="summary-card">
                <span>Opportunities</span>
                <strong>{opportunities.length}</strong>
              </article>
              <article className="summary-card">
                <span>Projects</span>
                <strong>{projects.length}</strong>
              </article>
            </section>

            <section className="panel">
              <div className="data-toolbar">
                <div>
                  <h2>Read-only evidence links</h2>
                  <p className="muted">
                    Use these links to inspect records. Viewer role does not
                    expose approval, upload, or task mutation forms.
                  </p>
                </div>
                <Link className="button button-secondary" href="/copilot">
                  Retail Copilot explanations
                </Link>
              </div>
              <div className="actions">
                <Link className="button button-secondary" href="/consolidation/operating-view">
                  Operating View
                </Link>
                <Link className="button button-secondary" href="/inventory-recovery">
                  Inventory Recovery
                </Link>
                <Link className="button button-secondary" href="/projectisation">
                  Projectisation
                </Link>
              </div>
            </section>

            <section className="panel">
              <h2>Visible inventory sample</h2>
              {inventory.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product</th>
                        <th>Store</th>
                        <th>On hand</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((position) => (
                        <tr key={position.id}>
                          <td>{position.sku_code}</td>
                          <td>{position.product_name}</td>
                          <td>{position.location_name}</td>
                          <td>{position.on_hand_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No inventory evidence is visible.</p>
              )}
            </section>

            <section className="panel">
              <h2>Visible recovery records</h2>
              {opportunities.length || projects.length ? (
                <dl className="definition">
                  {opportunities.map((opportunity) => (
                    <div key={opportunity.id}>
                      <dt>{opportunity.attention_priority_band} opportunity</dt>
                      <dd>
                        <Link href={`/projectisation/opportunities/${opportunity.id}`}>
                          {opportunity.title}
                        </Link>
                      </dd>
                    </div>
                  ))}
                  {projects.map((project) => (
                    <div key={project.id}>
                      <dt>{project.status.replaceAll("_", " ")} project</dt>
                      <dd>
                        <Link href={`/projectisation/projects/${project.id}`}>
                          {project.name}
                        </Link>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="empty-state">
                  No recovery opportunity or project is visible.
                </p>
              )}
            </section>
          </div>
        );
      }}
    </RoleWorkspacePage>
  );
}
