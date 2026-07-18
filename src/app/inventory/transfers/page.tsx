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

type TransferListProps = {
  searchParams: Promise<{ error?: string }>;
};

type TransferRow = {
  created_at: string;
  destination_location_id: string;
  destination_label: string;
  id: string;
  origin_label: string;
  origin_location_id: string;
  reason: string;
  status: string;
};

const columns: readonly RetailDataGridColumn<TransferRow>[] = [
  {
    header: "Transfer",
    id: "transfer",
    render: (row) => (
      <>
        <Link href={`/inventory/transfers/${row.id}`}>
          <strong>{row.reason}</strong>
        </Link>
        <span className="table-meta">{row.id}</span>
      </>
    ),
  },
  {
    header: "Origin",
    id: "origin",
    render: (row) => row.origin_label,
  },
  {
    header: "Destination",
    id: "destination",
    render: (row) => row.destination_label,
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

export default async function TransferList({ searchParams }: TransferListProps) {
  const { error } = await searchParams;

  return (
    <InventoryPage
      description="Transfers reserve stock at approval, remove it at dispatch, and land it only after receipt."
      title="Stock transfers"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "inventory.view")) {
          redirect("/workspace?error=permission-denied");
        }
        const organizationId = context.membership.organization_id;
        const [transfersResult, locationsResult] = await Promise.all([
          context.supabase
            .from("transfer_requests")
            .select("id, origin_location_id, destination_location_id, reason, status, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(50),
          context.supabase
            .from("locations")
            .select("id, name, code")
            .eq("organization_id", organizationId),
        ]);

        if (transfersResult.error || locationsResult.error) {
          redirect("/setup-error?error=setup-state");
        }

        const locationLabelById = new Map(
          (locationsResult.data ?? []).map((location) => [
            location.id,
            `${location.name} · ${location.code}`,
          ]),
        );
        const rows: TransferRow[] = (transfersResult.data ?? []).map((row) => ({
          ...row,
          destination_label:
            locationLabelById.get(row.destination_location_id) ?? row.destination_location_id,
          origin_label: locationLabelById.get(row.origin_location_id) ?? row.origin_location_id,
        }));

        return (
          <div className="content-grid">
            {error ? (
              <Notice title="Transfer action failed" tone="error">
                RetailOS failed closed. Check workflow status, role, location scope, and stock availability.
              </Notice>
            ) : null}
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/inventory">
                  Current positions
                </Link>
                {hasPermission(context.membership.role, "transfer.manage") ? (
                  <Link className="button button-primary" href="/inventory/transfers/new">
                    New transfer
                  </Link>
                ) : null}
              </div>
              <RetailDataGrid
                caption="Stock transfer workflow queue"
                columns={columns}
                emptyTitle="No transfer requests yet"
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
