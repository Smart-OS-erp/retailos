import { IntelligencePage } from "@/components/intelligence-page";

export default function SkuIntelligencePage() {
  return (
    <IntelligencePage
      description="Every score is attached to a persisted inventory position, rule version, evaluation time, and suppression reason."
      title="SKU intelligence"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const { data: insights } = await context.supabase
          .from("inventory_risk_insights")
          .select("id, inventory_position_id, age_band, data_confidence_score, inventory_risk_score, inventory_risk_band, recovery_opportunity_score, attention_priority_score, attention_priority_band, suppression_reason, rule_version, evaluated_at")
          .eq("organization_id", organizationId)
          .order("attention_priority_score", { ascending: false, nullsFirst: false })
          .limit(200);
        const positionIds = (insights ?? []).map((insight) => insight.inventory_position_id);
        const { data: positions } = positionIds.length
          ? await context.supabase
              .from("current_inventory_positions")
              .select("id, sku_code, product_name, location_name")
              .eq("organization_id", organizationId)
              .in("id", positionIds)
          : { data: [] };
        const positionById = new Map((positions ?? []).map((position) => [position.id, position]));

        return (
          <section className="panel">
            {insights?.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>SKU</th><th>Location</th><th>Age</th><th>Confidence</th><th>Risk</th><th>Opportunity</th><th>Attention</th></tr></thead>
                  <tbody>
                    {insights.map((insight) => {
                      const position = positionById.get(insight.inventory_position_id);
                      return (
                        <tr key={insight.id}>
                          <td>{position?.sku_code ?? "Source unavailable"}</td>
                          <td>{position?.location_name ?? "Restricted"}</td>
                          <td>{insight.age_band ?? "Unknown"}</td>
                          <td>{insight.data_confidence_score}</td>
                          <td>{insight.inventory_risk_score ?? insight.suppression_reason ?? "Unknown"}</td>
                          <td>{insight.recovery_opportunity_score ?? "Suppressed"}</td>
                          <td>{insight.attention_priority_score ?? insight.attention_priority_band ?? "Suppressed"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">Run intelligence after consolidating approved inventory.</p>
            )}
          </section>
        );
      }}
    </IntelligencePage>
  );
}
