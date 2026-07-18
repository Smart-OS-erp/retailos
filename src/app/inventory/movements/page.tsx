import Link from "next/link";
import { redirect } from "next/navigation";

import { InventoryPage } from "@/components/inventory-page";
import {
  RetailDataGrid,
  type RetailDataGridColumn,
} from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailDateTime } from "@/lib/ui/market";

type MovementRow = {
  created_at: string;
  id: string;
  location_id: string;
  location_label: string;
  movement_type: string;
  quantity_after: number | null;
  quantity_before: number | null;
  quantity_delta: number;
  reason: string | null;
  sku_code: string;
  source_id: string;
  source_type: string;
};

const columns: readonly RetailDataGridColumn<MovementRow>[] = [
  {
    header: "Movement",
    id: "movement",
    render: (row) => (
      <>
        <StatusBadge status={row.movement_type} />
        <span className="table-meta">{row.source_type.replaceAll("_", " ")}</span>
      </>
    ),
  },
  {
    header: "SKU",
    id: "sku",
    render: (row) => row.sku_code,
  },
  {
    header: "Location",
    id: "location",
    render: (row) => row.location_label,
  },
  {
    align: "end",
    header: "Delta",
    id: "delta",
    render: (row) => row.quantity_delta.toLocaleString(),
  },
  {
    align: "end",
    header: "Before → after",
    id: "before-after",
    render: (row) =>
      row.quantity_before === null || row.quantity_after === null
        ? "Legacy movement"
        : `${row.quantity_before.toLocaleString()} → ${row.quantity_after.toLocaleString()}`,
  },
  {
    header: "Reason",
    id: "reason",
    render: (row) => row.reason ?? "No reason recorded",
  },
  {
    header: "Recorded",
    id: "recorded",
    render: (row) => formatRetailDateTime(row.created_at),
  },
];

export default async function MovementsPage() {
  return (
    <InventoryPage
      description="Immutable inventory movement evidence for adjustment, transfer, and stock-count operations."
      title="Movement history"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "inventory.view")) {
          redirect("/workspace?error=permission-denied");
        }

        const organizationId = context.membership.organization_id;
        const [movementsResult, locationsResult, skusResult] = await Promise.all([
          context.supabase
            .from("inventory_movements")
            .select("id, sku_id, location_id, source_type, source_id, movement_type, quantity_delta, quantity_before, quantity_after, reason, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(100),
          context.supabase
            .from("locations")
            .select("id, name, code")
            .eq("organization_id", organizationId),
          context.supabase
            .from("skus")
            .select("id, sku_code")
            .eq("organization_id", organizationId),
        ]);

        if (movementsResult.error || locationsResult.error || skusResult.error) {
          redirect("/setup-error?error=setup-state");
        }

        const locationLabelById = new Map(
          (locationsResult.data ?? []).map((location) => [
            location.id,
            `${location.name} · ${location.code}`,
          ]),
        );
        const skuCodeById = new Map(
          (skusResult.data ?? []).map((sku) => [sku.id, sku.sku_code]),
        );
        const rows: MovementRow[] = (movementsResult.data ?? []).map((movement) => ({
          ...movement,
          location_label: locationLabelById.get(movement.location_id) ?? movement.location_id,
          sku_code: skuCodeById.get(movement.sku_id) ?? movement.sku_id,
        }));

        return (
          <div className="content-grid">
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/inventory">
                  Current positions
                </Link>
              </div>
              <RetailDataGrid
                caption="Inventory movement history"
                columns={columns}
                emptyTitle="No inventory movements yet"
                getRowKey={(row) => row.id}
                rows={rows}
              />
            </section>
          </div>
        );
      }}
    </InventoryPage>
  );
}
