import Link from "next/link";

import { RoleWorkspacePage } from "@/components/role-workspace-page";
import type { Json } from "@/types/database";

function asRecord(value: Json | null | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function addCurrencyValue(
  totals: Map<string, number>,
  currency: string | null,
  value: number | null,
) {
  if (!currency || value === null) return;
  totals.set(currency, (totals.get(currency) ?? 0) + value);
}

export default function ExecutiveWorkspacePage() {
  return (
    <RoleWorkspacePage
      allowedRoles={["org_owner", "executive"]}
      description="An overnight retail-analyst view of live Phase 0 evidence: recovery value, approvals, risk, and next safe actions."
      eyebrow="Executive workspace"
      title="What needs executive attention?"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [
          briefingResult,
          opportunitiesResult,
          projectsResult,
          projectItemsResult,
          briefsResult,
        ] = await Promise.all([
          context.supabase
            .from("executive_briefings")
            .select("summary, caveats, rule_version, generated_at")
            .eq("organization_id", organizationId)
            .order("generated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          context.supabase
            .from("recovery_opportunities")
            .select("id, title, attention_priority_band, estimated_value, currency_code, status")
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
          context.supabase
            .from("recovery_project_skus")
            .select("quantity, approved_unit_cost, currency_code")
            .eq("organization_id", organizationId),
          context.supabase
            .from("campaign_briefs")
            .select("id, status")
            .eq("organization_id", organizationId)
            .eq("status", "pending_approval"),
        ]);

        const opportunities = opportunitiesResult.data ?? [];
        const projects = projectsResult.data ?? [];
        const pendingProjects = projects.filter(
          (project) => project.status === "pending_approval",
        ).length;
        const briefingSummary = asRecord(briefingResult.data?.summary);
        const opportunityTotals = asRecord(briefingSummary.totals_by_currency);
        const projectisedTotals = new Map<string, number>();
        for (const item of projectItemsResult.data ?? []) {
          addCurrencyValue(
            projectisedTotals,
            item.currency_code,
            item.approved_unit_cost === null ? null : item.quantity * item.approved_unit_cost,
          );
        }

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Executive recovery status">
              <article className="summary-card">
                <span>Open opportunities</span>
                <strong>{opportunities.length}</strong>
              </article>
              <article className="summary-card">
                <span>Pending approvals</span>
                <strong>{pendingProjects + (briefsResult.data?.length ?? 0)}</strong>
              </article>
              <article className="summary-card">
                <span>Active projects</span>
                <strong>
                  {
                    projects.filter(
                      (project) =>
                        !["completed", "cancelled"].includes(project.status),
                    ).length
                  }
                </strong>
              </article>
            </section>

            <section className="panel">
              <div className="data-toolbar">
                <div>
                  <h2>Executive briefing</h2>
                  <p className="muted">
                    Currency values remain separated. RetailOS does not infer FX
                    rates in Phase 0.
                  </p>
                </div>
                <Link className="button button-secondary" href="/copilot/morning-brief">
                  Ask Retail Copilot
                </Link>
              </div>
              {Object.keys(opportunityTotals).length ? (
                <dl className="definition">
                  {Object.entries(opportunityTotals).map(([currency, value]) => (
                    <div key={currency}>
                      <dt>Open recovery value · {currency}</dt>
                      <dd>
                        {typeof value === "number"
                          ? value.toLocaleString("en-NG")
                          : "Unknown"}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="empty-state">
                  No executive briefing has been generated from visible evidence.
                </p>
              )}
              {briefingResult.data ? (
                <p className="muted">
                  Rule version: {briefingResult.data.rule_version} · Generated{" "}
                  {new Date(briefingResult.data.generated_at).toLocaleString(
                    "en-NG",
                  )}
                </p>
              ) : null}
            </section>

            <section className="panel">
              <h2>Dead Stock Value Projectised</h2>
              {projectisedTotals.size ? (
                <dl className="definition">
                  {[...projectisedTotals.entries()].sort().map(([currency, value]) => (
                    <div key={currency}>
                      <dt>{currency}</dt>
                      <dd>{value.toLocaleString("en-NG")}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="empty-state">
                  No approved-cost project items are visible yet.
                </p>
              )}
            </section>

            <section className="panel">
              <h2>Highest priority opportunities</h2>
              {opportunities.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Opportunity</th>
                        <th>Priority</th>
                        <th>Value</th>
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
                          <td>
                            {opportunity.estimated_value.toLocaleString("en-NG")}{" "}
                            {opportunity.currency_code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">
                  No open recovery opportunities are visible.
                </p>
              )}
            </section>
          </div>
        );
      }}
    </RoleWorkspacePage>
  );
}
