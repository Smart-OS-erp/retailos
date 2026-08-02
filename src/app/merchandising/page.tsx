import Link from "next/link";
import { redirect } from "next/navigation";

import { MerchandisingPage } from "@/components/merchandising-page";
import { RetailDataGrid, type RetailDataGridColumn } from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailCurrency } from "@/lib/ui/market";

type ProductivityRow = {
  available_quantity: number;
  currency_code: string | null;
  gross_revenue_90: number;
  inventory_value: number | null;
  planning_signal: string;
  product_id: string;
  product_name: string;
  productivity_band: string;
  sell_through_rate_90: number | null;
  sku_code: string;
  units_sold_90: number;
};

const columns: readonly RetailDataGridColumn<ProductivityRow>[] = [
  {
    header: "Product",
    id: "product",
    render: (row) => (
      <>
        <strong>{row.product_name}</strong>
        <span className="table-meta">{row.sku_code}</span>
      </>
    ),
  },
  {
    header: "Productivity",
    id: "productivity",
    render: (row) => <StatusBadge status={row.productivity_band} />,
  },
  {
    header: "Planning signal",
    id: "signal",
    render: (row) => <StatusBadge status={row.planning_signal} />,
  },
  {
    align: "end",
    header: "90-day units",
    id: "units",
    render: (row) => row.units_sold_90.toLocaleString(),
  },
  {
    align: "end",
    header: "Sell-through proxy",
    id: "sell-through",
    render: (row) => row.sell_through_rate_90 === null ? "Insufficient data" : `${row.sell_through_rate_90}%`,
  },
  {
    align: "end",
    header: "Inventory value",
    id: "value",
    render: (row) =>
      row.inventory_value === null
        ? "Cost unavailable"
        : formatRetailCurrency(
            row.inventory_value,
            row.currency_code ? { currency: row.currency_code } : {},
          ),
  },
];

export default async function MerchandisingOverview() {
  return (
    <MerchandisingPage
      description="Historical merchandising planning from persisted inventory, sales, and risk evidence. No fake forecasts or autonomous execution."
      milestone="M2.0-M2.6"
      title="Merchandising & Planning OS"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "merchandising.view")) {
          redirect("/workspace");
        }

        const organizationId = context.membership.organization_id;
        const [metricsResult, recommendationsResult, draftsResult, plansResult] = await Promise.all([
          context.supabase
            .from("product_productivity_metrics")
            .select("product_id, product_name, sku_code, available_quantity, units_sold_90, gross_revenue_90, inventory_value, currency_code, sell_through_rate_90, productivity_band, planning_signal")
            .eq("organization_id", organizationId)
            .order("units_sold_90", { ascending: false })
            .limit(8),
          context.supabase
            .from("merchandising_recommendations")
            .select("id")
            .eq("organization_id", organizationId)
            .eq("status", "proposed"),
          context.supabase
            .from("markdown_plan_drafts")
            .select("id")
            .eq("organization_id", organizationId)
            .in("status", ["draft", "in_review"]),
          context.supabase
            .from("merchandising_plan_cycles")
            .select("id")
            .eq("organization_id", organizationId)
            .in("status", ["draft", "in_review", "approved"]),
        ]);

        if (
          metricsResult.error ||
          recommendationsResult.error ||
          draftsResult.error ||
          plansResult.error
        ) {
          redirect("/setup-error?error=setup-state");
        }

        const rows = (metricsResult.data ?? []) as ProductivityRow[];
        const totalInventoryValue = rows.reduce(
          (sum, row) => sum + (row.inventory_value ?? 0),
          0,
        );
        const currency = rows.find((row) => row.currency_code)?.currency_code ?? "NGN";

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Phase 2 merchandising summary">
              <article className="summary-card">
                <span>Visible products</span>
                <strong>{rows.length.toLocaleString()}</strong>
              </article>
              <article className="summary-card">
                <span>Open recommendations</span>
                <strong>{(recommendationsResult.data ?? []).length.toLocaleString()}</strong>
              </article>
              <article className="summary-card">
                <span>Markdown drafts</span>
                <strong>{(draftsResult.data ?? []).length.toLocaleString()}</strong>
              </article>
              <article className="summary-card">
                <span>Visible stock value</span>
                <strong>{formatRetailCurrency(totalInventoryValue, { currency })}</strong>
              </article>
            </section>

            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/merchandising/productivity">
                  Product productivity
                </Link>
                <Link className="button button-secondary" href="/merchandising/performance">
                  Group performance
                </Link>
                <Link className="button button-secondary" href="/merchandising/recommendations">
                  Recommendations
                </Link>
                <Link className="button button-secondary" href="/merchandising/plans">
                  Planning cycles
                </Link>
              </div>
            </section>

            <section className="panel">
              <h2>Current productivity sample</h2>
              <p className="muted">
                These rows come from live tenant inventory and sales facts. Sell-through is a historical proxy, not a forecast.
              </p>
              <RetailDataGrid
                caption="Phase 2 product productivity sample"
                columns={columns}
                emptyTitle="No merchandising productivity evidence yet"
                getRowKey={(row) => `${row.product_id}-${row.sku_code}`}
                rows={rows}
              />
            </section>
          </div>
        );
      }}
    </MerchandisingPage>
  );
}
