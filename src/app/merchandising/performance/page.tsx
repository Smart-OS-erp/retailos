import { redirect } from "next/navigation";

import { MerchandisingPage } from "@/components/merchandising-page";
import { RetailDataGrid, type RetailDataGridColumn } from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailCurrency } from "@/lib/ui/market";

type Row = {
  average_sell_through_rate_90: number | null;
  available_quantity: number;
  currency_code: string | null;
  gross_revenue_90: number;
  group_id: string | null;
  group_name: string;
  group_type: string;
  inventory_value: number | null;
  product_count: number;
  sku_count: number;
  units_sold_90: number;
};

const columns: readonly RetailDataGridColumn<Row>[] = [
  {
    header: "Group",
    id: "group",
    render: (row) => (
      <>
        <strong>{row.group_name}</strong>
        <span className="table-meta">{row.group_type}</span>
      </>
    ),
  },
  { header: "Type", id: "type", render: (row) => <StatusBadge status={row.group_type} /> },
  { align: "end", header: "Products", id: "products", render: (row) => row.product_count.toLocaleString() },
  { align: "end", header: "SKUs", id: "skus", render: (row) => row.sku_count.toLocaleString() },
  { align: "end", header: "90d units", id: "units", render: (row) => row.units_sold_90.toLocaleString() },
  {
    align: "end",
    header: "Avg sell-through",
    id: "sellThrough",
    render: (row) => row.average_sell_through_rate_90 === null ? "Insufficient data" : `${row.average_sell_through_rate_90}%`,
  },
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

export default async function MerchandisingPerformancePage() {
  return (
    <MerchandisingPage
      description="M2.2 brand, category, and collection performance from persisted product, inventory, and sales facts."
      milestone="M2.2"
      title="Group performance"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "merchandising.view")) redirect("/workspace");

        const { data, error } = await context.supabase
          .from("merchandising_group_performance")
          .select("*")
          .eq("organization_id", context.membership.organization_id)
          .order("group_type", { ascending: true })
          .order("units_sold_90", { ascending: false })
          .limit(100);

        if (error) redirect("/setup-error?error=setup-state");

        return (
          <section className="panel">
            <p className="muted">
              Collection rows are only meaningful after products are assigned to Phase 2 merchandising collections. Unassigned rows remain explicit, not guessed.
            </p>
            <RetailDataGrid
              caption="Merchandising group performance"
              columns={columns}
              emptyTitle="No group performance evidence yet"
              getRowKey={(row) => `${row.group_type}-${row.group_id ?? row.group_name}`}
              rows={(data ?? []) as Row[]}
            />
          </section>
        );
      }}
    </MerchandisingPage>
  );
}
