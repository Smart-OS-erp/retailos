import { IntelligencePage } from "@/components/intelligence-page";

const ageBands = ["fresh", "watch", "aged", "dead", "unknown"] as const;

export default function AgingIntelligencePage() {
  return (
    <IntelligencePage
      description="Age bands follow the approved 0–60, 61–90, 91–180, and over-180-day rules."
      title="Inventory age profile"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const { data: insights } = await context.supabase
          .from("inventory_risk_insights")
          .select("id, age_band, inventory_value, currency_code, suppression_reason")
          .eq("organization_id", organizationId);
        const counts = new Map(ageBands.map((band) => [band, 0]));
        for (const insight of insights ?? []) {
          const band = insight.age_band ?? "unknown";
          counts.set(band, (counts.get(band) ?? 0) + 1);
        }

        return (
          <section className="panel">
            <div className="summary-grid">
              {ageBands.map((band) => (
                <article className="summary-card" key={band}>
                  <span>{band}</span>
                  <strong>{counts.get(band) ?? 0}</strong>
                </article>
              ))}
            </div>
            <p className="muted">
              Monetary values are intentionally omitted from this cross-currency profile.
            </p>
          </section>
        );
      }}
    </IntelligencePage>
  );
}
