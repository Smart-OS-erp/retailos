import Link from "next/link";

import { IntelligencePage } from "@/components/intelligence-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";
import type { Json } from "@/types/database";

import { runInventoryRecoveryIntelligence } from "./actions";

type RecoveryOverviewPageProps = {
  searchParams: Promise<{ error?: string; run?: string }>;
};

function asRecord(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export default async function RecoveryOverviewPage({
  searchParams,
}: RecoveryOverviewPageProps) {
  const state = await searchParams;

  return (
    <IntelligencePage
      description="Deterministic, versioned scores use the latest approved inventory only. Low-confidence and missing evidence are suppressed, not guessed."
      title="What requires attention now?"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [insightsResult, opportunitiesResult, briefingResult] =
          await Promise.all([
            context.supabase
              .from("inventory_risk_insights")
              .select("id, inventory_risk_status, attention_priority_band, suppression_reason")
              .eq("organization_id", organizationId),
            context.supabase
              .from("recovery_opportunities")
              .select("id, attention_priority_band, estimated_value, currency_code")
              .eq("organization_id", organizationId)
              .eq("status", "open"),
            context.supabase
              .from("executive_briefings")
              .select("summary, caveats, rule_version, generated_at")
              .eq("organization_id", organizationId)
              .order("generated_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);
        const insights = insightsResult.data ?? [];
        const opportunities = opportunitiesResult.data ?? [];
        const urgent = opportunities.filter(
          (opportunity) => opportunity.attention_priority_band === "urgent",
        ).length;
        const suppressed = insights.filter(
          (insight) => insight.inventory_risk_status !== "known",
        ).length;
        const summary = briefingResult.data
          ? asRecord(briefingResult.data.summary)
          : {};
        const totals = summary.totals_by_currency
          ? asRecord(summary.totals_by_currency)
          : {};

        return (
          <div className="content-grid">
            {state.run ? (
              <Notice title="Intelligence refreshed" tone="success">
                Results were authored from the current approved snapshot and recorded with versioned evidence.
              </Notice>
            ) : state.error ? (
              <Notice title="Intelligence not run" tone="error">
                RetailOS failed closed. Confirm an approved snapshot and the required permission.
              </Notice>
            ) : null}
            <section className="summary-grid" aria-label="Persisted attention status">
              <article className="summary-card"><span>Open opportunities</span><strong>{opportunities.length}</strong></article>
              <article className="summary-card"><span>Urgent attention</span><strong>{urgent}</strong></article>
              <article className="summary-card"><span>Suppressed or unknown</span><strong>{suppressed}</strong></article>
            </section>
            <section className="panel">
              <div className="data-toolbar">
                <div>
                  <h2>Executive briefing</h2>
                  <p className="muted">
                    Values remain separated by currency. There is no inferred FX rate or autonomous action.
                  </p>
                </div>
                {hasPermission(context.membership.role, "intelligence.run") ? (
                  <form action={runInventoryRecoveryIntelligence}>
                    <button className="button button-primary" type="submit">
                      Run from approved inventory
                    </button>
                  </form>
                ) : null}
              </div>
              {Object.keys(totals).length ? (
                <dl className="definition">
                  {Object.entries(totals).map(([currency, value]) => (
                    <div key={currency}>
                      <dt>Opportunity value · {currency}</dt>
                      <dd>{typeof value === "number" ? value.toLocaleString("en-NG") : "Unknown"}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="empty-state">
                  No briefing exists for the currently visible approved inventory.
                </p>
              )}
            </section>
            <section className="panel">
              <h2>Explore the evidence</h2>
              <div className="actions">
                <Link className="button button-secondary" href="/attention-queue">Attention Queue</Link>
                <Link className="button button-secondary" href="/inventory-recovery/skus">SKU intelligence</Link>
                <Link className="button button-secondary" href="/inventory-recovery/aging">Age profile</Link>
                <Link className="button button-secondary" href="/inventory-recovery/categories">Categories</Link>
                <Link className="button button-secondary" href="/inventory-recovery/stores">Stores</Link>
              </div>
            </section>
          </div>
        );
      }}
    </IntelligencePage>
  );
}
