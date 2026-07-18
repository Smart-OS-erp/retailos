import Link from "next/link";
import { redirect } from "next/navigation";

import { InventoryPage } from "@/components/inventory-page";
import { Notice } from "@/components/notice";
import {
  RetailDataGrid,
  type RetailDataGridColumn,
} from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailCurrency, formatRetailDateTime } from "@/lib/ui/market";

type InventoryHomeProps = {
  searchParams: Promise<{ error?: string }>;
};

type BalanceRow = {
  available_quantity: number;
  approved_unit_cost: number | null;
  currency_code: string | null;
  in_transit_quantity: number;
  last_movement_at: string | null;
  location_code: string;
  location_name: string;
  on_hand_quantity: number;
  product_name: string;
  reserved_quantity: number;
  sku_code: string;
  sku_id: string;
};

const balanceColumns: readonly RetailDataGridColumn<BalanceRow>[] = [
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
    align: "end",
    header: "On hand",
    id: "on-hand",
    render: (row) => row.on_hand_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "Available",
    id: "available",
    render: (row) => row.available_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "Reserved",
    id: "reserved",
    render: (row) => row.reserved_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "In transit",
    id: "in-transit",
    render: (row) => row.in_transit_quantity.toLocaleString(),
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
    header: "Last movement",
    id: "last-movement",
    render: (row) =>
      row.last_movement_at ? formatRetailDateTime(row.last_movement_at) : "No ledger movement",
  },
];

export default async function InventoryHome({ searchParams }: InventoryHomeProps) {
  const { error } = await searchParams;

  return (
    <InventoryPage
      description="Live Phase 1 balances combine approved inventory snapshots with audited stock movements, reservations, and in-transit transfers."
      title="Current inventory positions"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "inventory.view")) {
          redirect("/workspace?error=permission-denied");
        }

        const organizationId = context.membership.organization_id;
        const [
          balancesResult,
          adjustmentsResult,
          transfersResult,
          countsResult,
          watchlistResult,
          movementsResult,
        ] =
          await Promise.all([
            context.supabase
              .from("current_inventory_balances")
              .select(
                "sku_id, sku_code, product_name, location_name, location_code, on_hand_quantity, reserved_quantity, available_quantity, in_transit_quantity, approved_unit_cost, currency_code, last_movement_at",
              )
              .eq("organization_id", organizationId)
              .order("location_name", { ascending: true })
              .order("sku_code", { ascending: true })
              .limit(50),
            context.supabase
              .from("stock_adjustments")
              .select("id, status")
              .eq("organization_id", organizationId),
            context.supabase
              .from("transfer_requests")
              .select("id, status")
              .eq("organization_id", organizationId),
            context.supabase
              .from("stock_counts")
              .select("id, status")
              .eq("organization_id", organizationId),
            context.supabase
              .from("inventory_stock_watchlist")
              .select("sku_id, location_id, watch_status")
              .eq("organization_id", organizationId)
              .neq("watch_status", "healthy"),
            context.supabase
              .from("inventory_movements")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", organizationId),
          ]);

        if (
          balancesResult.error ||
          adjustmentsResult.error ||
          transfersResult.error ||
          countsResult.error ||
          watchlistResult.error
        ) {
          redirect("/setup-error?error=setup-state");
        }

        const balances = (balancesResult.data ?? []) as BalanceRow[];
        const openAdjustments = (adjustmentsResult.data ?? []).filter((row) =>
          ["pending_approval", "approved"].includes(row.status),
        ).length;
        const openTransfers = (transfersResult.data ?? []).filter(
          (row) => !["received", "rejected", "cancelled"].includes(row.status),
        ).length;
        const openCounts = (countsResult.data ?? []).filter((row) =>
          ["submitted", "reviewed"].includes(row.status),
        ).length;
        const watchlistCount = (watchlistResult.data ?? []).length;

        return (
          <div className="content-grid">
            {error ? (
              <Notice title="Inventory action failed" tone="error">
                The operation failed closed. Check status, role, location scope, and stock availability.
              </Notice>
            ) : null}
            <section className="summary-grid" aria-label="Inventory operations status">
              <article className="summary-card">
                <span>Positions</span>
                <strong>{balances.length.toLocaleString()}</strong>
              </article>
              <article className="summary-card">
                <span>Watchlist items</span>
                <strong>{watchlistCount.toLocaleString()}</strong>
              </article>
              <article className="summary-card">
                <span>Open adjustments</span>
                <strong>{openAdjustments.toLocaleString()}</strong>
              </article>
              <article className="summary-card">
                <span>Active transfers</span>
                <strong>{openTransfers.toLocaleString()}</strong>
              </article>
              <article className="summary-card">
                <span>Open counts</span>
                <strong>{openCounts.toLocaleString()}</strong>
              </article>
              <article className="summary-card">
                <span>Ledger entries</span>
                <strong>{(movementsResult.count ?? 0).toLocaleString()}</strong>
              </article>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Operational inventory</h2>
                  <p className="muted">
                    Values are tenant-scoped and derived from persisted records.
                  </p>
                </div>
                <div className="actions">
                  <Link className="button button-secondary" href="/inventory/movements">
                    Movement history
                  </Link>
                  <Link className="button button-secondary" href="/inventory/watchlist">
                    Watchlist
                  </Link>
                  <Link className="button button-secondary" href="/inventory/search">
                    Lookup
                  </Link>
                  {hasPermission(context.membership.role, "inventory.manage") ? (
                    <Link className="button button-primary" href="/inventory/adjustments/new">
                      New adjustment
                    </Link>
                  ) : null}
                  {hasPermission(context.membership.role, "transfer.manage") ? (
                    <Link className="button button-primary" href="/inventory/transfers/new">
                      New transfer
                    </Link>
                  ) : null}
                </div>
              </div>
              <RetailDataGrid
                caption="Current inventory balances"
                columns={balanceColumns}
                emptyTitle="No approved inventory positions yet"
                getRowKey={(row) => `${row.sku_id}:${row.location_code}`}
                rows={balances}
              />
            </section>
            <section className="panel">
              <h2>Workflow queues</h2>
              <div className="table-action-stack">
                <Link href="/inventory/adjustments">
                  <StatusBadge status={openAdjustments ? "pending" : "completed"} /> Stock adjustments
                </Link>
                <Link href="/inventory/transfers">
                  <StatusBadge status={openTransfers ? "pending" : "completed"} /> Transfers
                </Link>
                <Link href="/inventory/counts">
                  <StatusBadge status={openCounts ? "pending" : "completed"} /> Store stock counts
                </Link>
                <Link href="/inventory/watchlist">
                  <StatusBadge status={watchlistCount ? "warning" : "completed"} /> Low/overstock watchlist
                </Link>
                <Link href="/inventory/search">
                  <StatusBadge status="active" /> SKU/barcode lookup
                </Link>
              </div>
            </section>
          </div>
        );
      }}
    </InventoryPage>
  );
}
