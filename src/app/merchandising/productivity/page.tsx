import { redirect } from "next/navigation";

import { MerchandisingPage } from "@/components/merchandising-page";
import { RetailDataGrid, type RetailDataGridColumn } from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailCurrency, formatRetailDateTime } from "@/lib/ui/market";

type Row = {
  calculated_at: string;
  category_name: string | null;
  currency_code: string | null;
  data_confidence_score: number;
  gross_revenue_90: number;
  inventory_value: number | null;
  location_code: string;
  location_name: string;
  on_hand_quantity: number;
  planning_signal: string;
  product_id: string;
  product_name: string;
  productivity_band: string;
  sell_through_rate_90: number | null;
  sku_code: string;
  units_sold_30: number;
  units_sold_90: number;
};

const columns: readonly RetailDataGridColumn<Row>[] = [
  {
    header: "Product",
    id: "product",
    render: (row) => (
      <>
        <strong>{row.product_name}</strong>
        <span className="table-meta">{row.sku_code} · {row.category_name ?? "Unclassified"}</span>
      </>
    ),
  },
  {
    header: "Location",
    id: "location",
    render: (row) => `${row.location_name} (${row.location_code})`,
  },
  { header: "Band", id: "band", render: (row) => <StatusBadge status={row.productivity_band} /> },
  { header: "Signal", id: "signal", render: (row) => <StatusBadge status={row.planning_signal} /> },
  { align: "end", header: "30d sold", id: "sold30", render: (row) => row.units_sold_30.toLocaleString() },
  { align: "end", header: "90d sold", id: "sold90", render: (row) => row.units_sold_90.toLocaleString() },
  {
    align: "end",
    header: "Sell-through",
    id: "sellThrough",
    render: (row) => row.sell_through_rate_90 === null ? "Insufficient data" : `${row.sell_through_rate_90}%`,
  },
  { align: "end", header: "On hand", id: "onHand", render: (row) => row.on_hand_quantity.toLocaleString() },
  {
    align: "end",
    header: "Stock value",
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

export default async function ProductProductivityPage() {
  return (
    <MerchandisingPage
      description="M2.1 product productivity metrics derived from persisted inventory, sales, and risk evidence."
      milestone="M2.1"
      title="Product productivity"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "merchandising.view")) redirect("/workspace");

        const { data, error } = await context.supabase
          .from("product_productivity_metrics")
          .select("*")
          .eq("organization_id", context.membership.organization_id)
          .order("planning_signal", { ascending: true })
          .order("units_sold_90", { ascending: false })
          .limit(100);

        if (error) redirect("/setup-error?error=setup-state");
        const rows = (data ?? []) as Row[];
        const calculatedAt = rows[0]?.calculated_at;

        return (
          <section className="panel">
            <p className="muted">
              Calculated {calculatedAt ? formatRetailDateTime(calculatedAt) : "after the next approved data load"}. This page uses a historical sell-through proxy and does not claim predictive precision.
            </p>
            <RetailDataGrid
              caption="Product productivity metrics"
              columns={columns}
              emptyTitle="No product productivity metrics yet"
              getRowKey={(row) => `${row.product_id}-${row.sku_code}-${row.location_code}`}
              rows={rows}
            />
          </section>
        );
      }}
    </MerchandisingPage>
  );
}
