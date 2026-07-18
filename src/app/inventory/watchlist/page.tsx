import Link from "next/link";
import { redirect } from "next/navigation";

import { InventoryPage } from "@/components/inventory-page";
import {
  RetailDataGrid,
  type RetailDataGridColumn,
} from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailCurrency, formatRetailDateTime } from "@/lib/ui/market";

type WatchlistRow = {
  approved_unit_cost: number | null;
  available_quantity: number;
  calculated_at: string;
  currency_code: string | null;
  evidence_summary: string;
  location_code: string;
  location_name: string;
  on_hand_quantity: number;
  product_name: string;
  severity: string;
  sku_code: string;
  sku_id: string;
  units_sold_30: number | null;
  units_sold_90: number | null;
  watch_status: string;
};

const watchlistColumns: readonly RetailDataGridColumn<WatchlistRow>[] = [
  {
    header: "SKU",
    id: "sku",
    render: (row) => (
      <>
        <strong>{row.sku_code}</strong>
        <span className="table-meta">{row.product_name}</span>
      </>
    ),
  },
  {
    header: "Location",
    id: "location",
    render: (row) => (
      <>
        <strong>{row.location_name}</strong>
        <span className="table-meta">{row.location_code}</span>
      </>
    ),
  },
  {
    header: "Signal",
    id: "signal",
    render: (row) => <StatusBadge status={row.watch_status} />,
  },
  {
    header: "Severity",
    id: "severity",
    render: (row) => <StatusBadge status={row.severity} />,
  },
  {
    align: "end",
    header: "Available",
    id: "available",
    render: (row) => row.available_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "On hand",
    id: "on-hand",
    render: (row) => row.on_hand_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "Stock value",
    id: "value",
    render: (row) =>
      row.approved_unit_cost && row.currency_code
        ? formatRetailCurrency(row.approved_unit_cost * row.on_hand_quantity, {
            currency: row.currency_code,
          })
        : "Cost unavailable",
  },
  {
    header: "Evidence",
    id: "evidence",
    render: (row) => row.evidence_summary,
  },
];

export default async function InventoryWatchlist() {
  return (
    <InventoryPage
      description="Low-stock, out-of-stock, overstock, and in-transit alerts are derived from persisted balances and sales evidence. They are not forecasts."
      title="Inventory watchlist"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "inventory.view")) {
          redirect("/workspace?error=permission-denied");
        }

        const organizationId = context.membership.organization_id;
        const watchlistResult = await context.supabase
          .from("inventory_stock_watchlist")
          .select(
            "sku_id, sku_code, product_name, location_name, location_code, on_hand_quantity, available_quantity, units_sold_30, units_sold_90, approved_unit_cost, currency_code, watch_status, severity, evidence_summary, calculated_at",
          )
          .eq("organization_id", organizationId)
          .neq("watch_status", "healthy")
          .order("severity", { ascending: true })
          .order("location_name", { ascending: true })
          .order("sku_code", { ascending: true })
          .limit(100);

        if (watchlistResult.error) {
          redirect("/setup-error?error=setup-state");
        }

        const rows = (watchlistResult.data ?? []) as WatchlistRow[];
        const calculatedAt = rows[0]?.calculated_at;

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Watchlist signal counts">
              <article className="summary-card">
                <span>Watchlist items</span>
                <strong>{rows.length.toLocaleString()}</strong>
              </article>
              <article className="summary-card">
                <span>High severity</span>
                <strong>
                  {rows.filter((row) => row.severity === "high").length.toLocaleString()}
                </strong>
              </article>
              <article className="summary-card">
                <span>Overstock signals</span>
                <strong>
                  {rows.filter((row) => row.watch_status === "overstock").length.toLocaleString()}
                </strong>
              </article>
              <article className="summary-card">
                <span>Calculated</span>
                <strong>{calculatedAt ? formatRetailDateTime(calculatedAt) : "No signals"}</strong>
              </article>
            </section>
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/inventory">
                  Current positions
                </Link>
                <Link className="button button-secondary" href="/inventory/counts">
                  Stock counts
                </Link>
                <Link className="button button-secondary" href="/inventory/search">
                  Inventory lookup
                </Link>
              </div>
              <RetailDataGrid
                caption="Persisted-evidence inventory watchlist"
                columns={watchlistColumns}
                emptyTitle="No inventory watchlist signals"
                getRowKey={(row) => `${row.sku_id}:${row.location_code}:${row.watch_status}`}
                rows={rows}
              />
            </section>
          </div>
        );
      }}
    </InventoryPage>
  );
}
