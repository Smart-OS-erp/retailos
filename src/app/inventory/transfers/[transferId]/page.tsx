import { randomUUID } from "node:crypto";

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  approveTransferRequest,
  dispatchTransferRequest,
  receiveTransferRequest,
  rejectTransferRequest,
} from "@/app/inventory/actions";
import { InventoryPage } from "@/components/inventory-page";
import { Notice } from "@/components/notice";
import {
  RetailDataGrid,
  type RetailDataGridColumn,
} from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailDateTime } from "@/lib/ui/market";

type TransferDetailProps = {
  params: Promise<{ transferId: string }>;
  searchParams: Promise<{
    approved?: string;
    created?: string;
    dispatched?: string;
    error?: string;
    received?: string;
    rejected?: string;
  }>;
};

type TransferItem = {
  approved_quantity: number | null;
  damaged_quantity: number;
  dispatched_quantity: number;
  id: string;
  received_quantity: number;
  requested_quantity: number;
  sku_id: string;
  sku_code: string;
};

type MovementRow = {
  created_at: string;
  id: string;
  location_id: string;
  location_label: string;
  movement_type: string;
  quantity_after: number | null;
  quantity_before: number | null;
  quantity_delta: number;
};

type DiscrepancyRow = {
  discrepancy_type: string;
  id: string;
  received_quantity: number;
  status: string;
  variance_quantity: number;
};

const itemColumns: readonly RetailDataGridColumn<TransferItem>[] = [
  {
    header: "SKU",
    id: "sku",
    render: (row) => row.sku_code,
  },
  {
    align: "end",
    header: "Requested",
    id: "requested",
    render: (row) => row.requested_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "Approved",
    id: "approved",
    render: (row) => (row.approved_quantity ?? 0).toLocaleString(),
  },
  {
    align: "end",
    header: "Dispatched",
    id: "dispatched",
    render: (row) => row.dispatched_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "Received",
    id: "received",
    render: (row) => row.received_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "Damaged",
    id: "damaged",
    render: (row) => row.damaged_quantity.toLocaleString(),
  },
];

const movementColumns: readonly RetailDataGridColumn<MovementRow>[] = [
  {
    header: "Movement",
    id: "movement",
    render: (row) => <StatusBadge status={row.movement_type} />,
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
    header: "Recorded",
    id: "recorded",
    render: (row) => formatRetailDateTime(row.created_at),
  },
];

const discrepancyColumns: readonly RetailDataGridColumn<DiscrepancyRow>[] = [
  {
    header: "Type",
    id: "type",
    render: (row) => row.discrepancy_type.replaceAll("_", " "),
  },
  {
    header: "Status",
    id: "status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    align: "end",
    header: "Received",
    id: "received",
    render: (row) => row.received_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "Variance",
    id: "variance",
    render: (row) => row.variance_quantity.toLocaleString(),
  },
];

function stateNotice(state: Awaited<TransferDetailProps["searchParams"]>) {
  if (state.error) {
    return (
      <Notice title="Transfer transition failed" tone="error">
        RetailOS failed closed. Check workflow status, location scope, and stock availability.
      </Notice>
    );
  }
  if (state.created) return <Notice title="Transfer requested" tone="success">Approval is required before stock is reserved.</Notice>;
  if (state.approved) return <Notice title="Transfer approved" tone="success">Stock is reserved until dispatch.</Notice>;
  if (state.dispatched) return <Notice title="Transfer dispatched" tone="success">Outbound movement is now in the ledger.</Notice>;
  if (state.received) return <Notice title="Transfer receipt recorded" tone="success">Inbound movement/discrepancy evidence was updated.</Notice>;
  if (state.rejected) return <Notice title="Transfer rejected" tone="success">No stock movement was written.</Notice>;
  return null;
}

export default async function TransferDetail({
  params,
  searchParams,
}: TransferDetailProps) {
  const [{ transferId }, state] = await Promise.all([params, searchParams]);
  const dispatchKey = `dispatch-${randomUUID()}`;

  return (
    <InventoryPage
      description="Transfer detail shows approval, reservation, dispatch, receiving, discrepancies, and movement evidence."
      title="Stock transfer detail"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [transferResult, itemsResult, movementsResult, discrepanciesResult, locationsResult, skusResult] =
          await Promise.all([
            context.supabase
              .from("transfer_requests")
              .select("id, origin_location_id, destination_location_id, reason, status, submitted_at, approved_at, dispatched_at, received_at")
              .eq("organization_id", organizationId)
              .eq("id", transferId)
              .maybeSingle(),
            context.supabase
              .from("transfer_items")
              .select("id, sku_id, requested_quantity, approved_quantity, dispatched_quantity, received_quantity, damaged_quantity")
              .eq("organization_id", organizationId)
              .eq("transfer_request_id", transferId)
              .order("created_at"),
            context.supabase
              .from("inventory_movements")
              .select("id, location_id, movement_type, quantity_delta, quantity_before, quantity_after, created_at")
              .eq("organization_id", organizationId)
              .eq("source_id", transferId)
              .order("created_at", { ascending: true }),
            context.supabase
              .from("transfer_discrepancies")
              .select("id, discrepancy_type, received_quantity, variance_quantity, status")
              .eq("organization_id", organizationId)
              .eq("transfer_request_id", transferId)
              .order("created_at", { ascending: true }),
            context.supabase
              .from("locations")
              .select("id, name, code")
              .eq("organization_id", organizationId),
            context.supabase
              .from("skus")
              .select("id, sku_code")
              .eq("organization_id", organizationId),
          ]);

        if (!transferResult.data || transferResult.error) notFound();
        if (
          itemsResult.error ||
          movementsResult.error ||
          discrepanciesResult.error ||
          locationsResult.error ||
          skusResult.error
        ) {
          notFound();
        }

        const transfer = transferResult.data;
        const locationLabelById = new Map(
          (locationsResult.data ?? []).map((location) => [
            location.id,
            `${location.name} · ${location.code}`,
          ]),
        );
        const skuCodeById = new Map(
          (skusResult.data ?? []).map((sku) => [sku.id, sku.sku_code]),
        );
        const items: TransferItem[] = (itemsResult.data ?? []).map((item) => ({
          ...item,
          sku_code: skuCodeById.get(item.sku_id) ?? item.sku_id,
        }));
        const movements: MovementRow[] = (movementsResult.data ?? []).map((movement) => ({
          ...movement,
          location_label: locationLabelById.get(movement.location_id) ?? movement.location_id,
        }));
        const canManage = hasPermission(context.membership.role, "transfer.manage");
        const canReceive = canManage && ["dispatched", "in_transit", "partially_received", "exception"].includes(transfer.status);

        return (
          <div className="content-grid">
            {stateNotice(state)}
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/inventory/transfers">
                  All transfers
                </Link>
                <Link className="button button-secondary" href="/inventory">
                  Current positions
                </Link>
              </div>
              <h2>{transfer.reason}</h2>
              <dl className="definition">
                <div><dt>Status</dt><dd><StatusBadge status={transfer.status} /></dd></div>
                <div><dt>Origin</dt><dd>{locationLabelById.get(transfer.origin_location_id) ?? transfer.origin_location_id}</dd></div>
                <div><dt>Destination</dt><dd>{locationLabelById.get(transfer.destination_location_id) ?? transfer.destination_location_id}</dd></div>
                <div><dt>Submitted</dt><dd>{formatRetailDateTime(transfer.submitted_at)}</dd></div>
                <div><dt>Approved</dt><dd>{transfer.approved_at ? formatRetailDateTime(transfer.approved_at) : "Not approved"}</dd></div>
                <div><dt>Dispatched</dt><dd>{transfer.dispatched_at ? formatRetailDateTime(transfer.dispatched_at) : "Not dispatched"}</dd></div>
                <div><dt>Received</dt><dd>{transfer.received_at ? formatRetailDateTime(transfer.received_at) : "Not fully received"}</dd></div>
              </dl>
              {canManage ? (
                <div className="actions">
                  {transfer.status === "pending_approval" ? (
                    <>
                      <form action={approveTransferRequest}>
                        <input name="transferId" type="hidden" value={transfer.id} />
                        <button className="button button-primary" type="submit">Approve transfer</button>
                      </form>
                      <form action={rejectTransferRequest}>
                        <input name="transferId" type="hidden" value={transfer.id} />
                        <input name="rejectionReason" type="hidden" value="Rejected from Phase 1 workspace" />
                        <button className="button button-secondary" type="submit">Reject transfer</button>
                      </form>
                    </>
                  ) : null}
                  {["approved", "picking"].includes(transfer.status) ? (
                    <form action={dispatchTransferRequest}>
                      <input name="transferId" type="hidden" value={transfer.id} />
                      <input name="idempotencyKey" type="hidden" value={dispatchKey} />
                      <button className="button button-primary" type="submit">Dispatch transfer</button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </section>
            <section className="panel">
              <h2>Transfer items</h2>
              <RetailDataGrid
                caption="Transfer item quantities"
                columns={itemColumns}
                getRowKey={(row) => row.id}
                rows={items}
              />
            </section>
            {canReceive ? (
              <section className="panel">
                <h2>Receive stock</h2>
                <p className="muted">
                  Record one item receipt at a time. Partial receipts keep an open discrepancy until fully reconciled.
                </p>
                <div className="content-grid">
                  {items.map((item) => {
                    const remaining = item.dispatched_quantity - item.received_quantity - item.damaged_quantity;
                    if (remaining <= 0) return null;
                    return (
                      <form action={receiveTransferRequest} className="stack" key={item.id}>
                        <input name="transferId" type="hidden" value={transfer.id} />
                        <input name="transferItemId" type="hidden" value={item.id} />
                        <input name="idempotencyKey" type="hidden" value={`receive-${item.id}-${randomUUID()}`} />
                        <strong>{item.sku_code}</strong>
                        <span className="muted">Remaining in transit: {remaining.toLocaleString()}</span>
                        <label className="field" htmlFor={`received-${item.id}`}>
                          <span className="field-label">Received quantity</span>
                          <input id={`received-${item.id}`} min={0} name="receivedQuantity" required type="number" />
                        </label>
                        <label className="field" htmlFor={`damaged-${item.id}`}>
                          <span className="field-label">Damaged quantity</span>
                          <input defaultValue={0} id={`damaged-${item.id}`} min={0} name="damagedQuantity" type="number" />
                        </label>
                        <button className="button button-primary" type="submit">Record receipt</button>
                      </form>
                    );
                  })}
                </div>
              </section>
            ) : null}
            <section className="panel">
              <h2>Discrepancies</h2>
              <RetailDataGrid
                caption="Transfer discrepancy evidence"
                columns={discrepancyColumns}
                emptyTitle="No transfer discrepancies recorded"
                getRowKey={(row) => row.id}
                rows={(discrepanciesResult.data ?? []) as DiscrepancyRow[]}
              />
            </section>
            <section className="panel">
              <h2>Movement ledger</h2>
              <RetailDataGrid
                caption="Transfer movement ledger entries"
                columns={movementColumns}
                emptyTitle="No movement has been written yet"
                getRowKey={(row) => row.id}
                rows={movements}
              />
            </section>
          </div>
        );
      }}
    </InventoryPage>
  );
}
