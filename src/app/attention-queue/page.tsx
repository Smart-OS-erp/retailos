import Link from "next/link";

import { IntelligencePage } from "@/components/intelligence-page";

export default function AttentionQueuePage() {
  return (
    <IntelligencePage
      description="Ranked recovery proposals from persisted evidence. Nothing here changes price, stock, or publishing."
      title="Attention Queue"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [opportunitiesResult, locationsResult] = await Promise.all([
          context.supabase
            .from("recovery_opportunities")
            .select("id, location_id, title, proposed_action, recovery_opportunity_score, attention_priority_score, attention_priority_band, estimated_value, currency_code, rule_version, status")
            .eq("organization_id", organizationId)
            .eq("status", "open")
            .order("attention_priority_score", { ascending: false }),
          context.supabase
            .from("locations")
            .select("id, name")
            .eq("organization_id", organizationId),
        ]);
        const locations = new Map(
          (locationsResult.data ?? []).map((location) => [location.id, location.name]),
        );
        const opportunities = opportunitiesResult.data ?? [];

        return (
          <section className="panel">
            {opportunities.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Priority</th><th>Opportunity</th><th>Store</th><th>Proposal</th><th>Value</th><th>Evidence version</th></tr></thead>
                  <tbody>
                    {opportunities.map((opportunity) => (
                      <tr key={opportunity.id}>
                        <td><span className="status-badge">{opportunity.attention_priority_band} · {opportunity.attention_priority_score}</span></td>
                        <td><Link href={`/projectisation/opportunities/${opportunity.id}`}>{opportunity.title}</Link></td>
                        <td>{locations.get(opportunity.location_id) ?? "Restricted"}</td>
                        <td>{opportunity.proposed_action}</td>
                        <td>{opportunity.estimated_value.toLocaleString("en-NG")} {opportunity.currency_code}</td>
                        <td>{opportunity.rule_version}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No recovery opportunity is currently supported by visible evidence.</p>
            )}
          </section>
        );
      }}
    </IntelligencePage>
  );
}
