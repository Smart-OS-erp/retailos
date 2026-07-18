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
import { formatRetailDateTime } from "@/lib/ui/market";

type AdjustmentListProps = {
  searchParams: Promise<{ error?: string }>;
};

type AdjustmentRow = {
  created_at: string;
  id: string;
  location_id: string;
  location_label: string;
  reason: string;
  status: string;
};

const columns: readonly RetailDataGridColumn<AdjustmentRow>[] = [
  {
    header: "Adjustment",
    id: "adjustment",
    render: (row) => (
      <>
        <Link href={`/inventory/adjustments/${row.id}`}>
          <strong>{row.reason}</strong>
        </Link>
        <span className="table-meta">{row.id}</span>
      </>
    ),
  },
  {
    header: "Location",
    id: "location",
    render: (row) => row.location_label,
  },
  {
    header: "Status",
    id: "status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Created",
    id: "created",
    render: (row) => formatRetailDateTime(row.created_at),
  },
];

export default async function AdjustmentList({ searchParams }: AdjustmentListProps) {
  const { error } = await searchParams;

  return (
    <InventoryPage
      description="Stock adjustments are request-first, approval-gated, executable, reversible, and audited."
      title="Stock adjustments"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "inventory.view")) {
          redirect("/workspace?error=permission-denied");
        }
        const organizationId = context.membership.organization_id;
        const [adjustmentsResult, locationsResult] = await Promise.all([
          context.supabase
            .from("stock_adjustments")
            .select("id, location_id, reason, status, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(50),
          context.supabase
            .from("locations")
            .select("id, name, code")
            .eq("organization_id", organizationId),
        ]);

        if (adjustmentsResult.error || locationsResult.error) {
          redirect("/setup-error?error=setup-state");
        }

        const locationLabelById = new Map(
          (locationsResult.data ?? []).map((location) => [
            location.id,
            `${location.name} · ${location.code}`,
          ]),
        );
        const rows: AdjustmentRow[] = (adjustmentsResult.data ?? []).map((row) => ({
          ...row,
          location_label: locationLabelById.get(row.location_id) ?? row.location_id,
        }));

        return (
          <div className="content-grid">
            {error ? (
              <Notice title="Adjustment action failed" tone="error">
                RetailOS failed closed. Check role, status, location scope, and stock availability.
              </Notice>
            ) : null}
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/inventory">
                  Current positions
                </Link>
                {hasPermission(context.membership.role, "inventory.manage") ? (
                  <Link className="button button-primary" href="/inventory/adjustments/new">
                    New adjustment
                  </Link>
                ) : null}
              </div>
              <RetailDataGrid
                caption="Stock adjustment workflow queue"
                columns={columns}
                emptyTitle="No stock adjustments yet"
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
