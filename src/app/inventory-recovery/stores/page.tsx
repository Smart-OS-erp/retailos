import Link from "next/link";

import { IntelligencePage } from "@/components/intelligence-page";

export default function StoreIntelligencePage() {
  return (
    <IntelligencePage
      description="Store summaries respect location assignments before aggregation."
      title="Store recovery"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [insightsResult, locationsResult] = await Promise.all([
          context.supabase
            .from("inventory_risk_insights")
            .select("id, location_id, attention_priority_band, suppression_reason")
            .eq("organization_id", organizationId),
          context.supabase
            .from("locations")
            .select("id, name")
            .eq("organization_id", organizationId),
        ]);
        const names = new Map((locationsResult.data ?? []).map((location) => [location.id, location.name]));
        const totals = new Map<string, { count: number; urgent: number; suppressed: number }>();
        for (const insight of insightsResult.data ?? []) {
          const current = totals.get(insight.location_id) ?? { count: 0, urgent: 0, suppressed: 0 };
          current.count += 1;
          if (insight.attention_priority_band === "urgent") current.urgent += 1;
          if (insight.suppression_reason) current.suppressed += 1;
          totals.set(insight.location_id, current);
        }

        return (
          <section className="panel">
            {totals.size ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Store</th><th>Positions assessed</th><th>Urgent</th><th>Suppressed</th></tr></thead>
                  <tbody>
                    {[...totals.entries()].map(([locationId, total]) => (
                      <tr key={locationId}>
                        <td><Link href={`/consolidation/stores/${locationId}`}>{names.get(locationId) ?? "Restricted"}</Link></td>
                        <td>{total.count}</td><td>{total.urgent}</td><td>{total.suppressed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No store intelligence is visible.</p>
            )}
          </section>
        );
      }}
    </IntelligencePage>
  );
}
