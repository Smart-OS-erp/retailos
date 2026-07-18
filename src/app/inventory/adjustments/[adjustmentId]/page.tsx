import { randomUUID } from "node:crypto";

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  approveStockAdjustment,
  executeStockAdjustment,
  rejectStockAdjustment,
  reverseStockAdjustment,
} from "@/app/inventory/actions";
import { InventoryPage } from "@/components/inventory-page";
import { Notice } from "@/components/notice";
import {
  RetailDataGrid,
  type RetailDataGridColumn,
} from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailCurrency, formatRetailDateTime } from "@/lib/ui/market";

type AdjustmentDetailProps = {
  params: Promise<{ adjustmentId: string }>;
  searchParams: Promise<{
    approved?: string;
    created?: string;
    error?: string;
    executed?: string;
    rejected?: string;
    reversed?: string;
  }>;
};

type AdjustmentItem = {
  id: string;
  quantity_delta: number;
  reason: string | null;
  sku_id: string;
  sku_code: string;
  unit_cost: number | null;
  currency_code: string | null;
};

type MovementRow = {
  created_at: string;
  id: string;
  movement_type: string;
  quantity_after: number | null;
  quantity_before: number | null;
  quantity_delta: number;
};

const itemColumns: readonly RetailDataGridColumn<AdjustmentItem>[] = [
  {
    header: "SKU",
    id: "sku",
    render: (row) => row.sku_code,
  },
  {
    align: "end",
    header: "Delta",
    id: "delta",
    render: (row) => row.quantity_delta.toLocaleString(),
  },
  {
    align: "end",
    header: "Value impact",
    id: "value",
    render: (row) =>
      row.unit_cost && row.currency_code
        ? formatRetailCurrency(row.unit_cost * row.quantity_delta, {
            currency: row.currency_code,
          })
        : "Cost unavailable",
  },
  {
    header: "Note",
    id: "note",
    render: (row) => row.reason ?? "No item note",
  },
];

const movementColumns: readonly RetailDataGridColumn<MovementRow>[] = [
  {
    header: "Type",
    id: "type",
    render: (row) => <StatusBadge status={row.movement_type} />,
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

function stateNotice(state: Awaited<AdjustmentDetailProps["searchParams"]>) {
  if (state.error) {
    return (
      <Notice title="Adjustment transition failed" tone="error">
        RetailOS failed closed. Check workflow status, permissions, and stock availability.
      </Notice>
    );
  }
  if (state.created) {
    return <Notice title="Adjustment requested" tone="success">Approval is required before execution.</Notice>;
  }
  if (state.approved) {
    return <Notice title="Adjustment approved" tone="success">The ledger is unchanged until execution.</Notice>;
  }
  if (state.executed) {
    return <Notice title="Adjustment executed" tone="success">A stock movement was written with before/after quantities.</Notice>;
  }
  if (state.rejected) {
    return <Notice title="Adjustment rejected" tone="success">No stock movement was written.</Notice>;
  }
  if (state.reversed) {
    return <Notice title="Adjustment reversed" tone="success">A compensating movement was written to the ledger.</Notice>;
  }
  return null;
}

export default async function AdjustmentDetail({
  params,
  searchParams,
}: AdjustmentDetailProps) {
  const [{ adjustmentId }, state] = await Promise.all([params, searchParams]);
  const executeKey = `execute-${randomUUID()}`;
  const reverseKey = `reverse-${randomUUID()}`;

  return (
    <InventoryPage
      description="Adjustment detail shows approval, execution, reversal, and source movement evidence."
      title="Stock adjustment detail"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [adjustmentResult, itemsResult, movementsResult, locationsResult, skusResult] = await Promise.all([
          context.supabase
            .from("stock_adjustments")
            .select("id, location_id, reason, status, submitted_at, approved_at, executed_at, reversed_at")
            .eq("organization_id", organizationId)
            .eq("id", adjustmentId)
            .maybeSingle(),
          context.supabase
            .from("stock_adjustment_items")
            .select("id, sku_id, quantity_delta, reason")
            .eq("organization_id", organizationId)
            .eq("stock_adjustment_id", adjustmentId),
          context.supabase
            .from("inventory_movements")
            .select("id, movement_type, quantity_delta, quantity_before, quantity_after, created_at")
            .eq("organization_id", organizationId)
            .eq("source_id", adjustmentId)
            .order("created_at", { ascending: true }),
          context.supabase
            .from("locations")
            .select("id, name, code")
            .eq("organization_id", organizationId),
          context.supabase
            .from("skus")
            .select("id, sku_code, approved_unit_cost, currency_code")
            .eq("organization_id", organizationId),
        ]);

        if (!adjustmentResult.data || adjustmentResult.error) notFound();
        if (itemsResult.error || movementsResult.error || locationsResult.error || skusResult.error) {
          notFound();
        }

        const adjustment = adjustmentResult.data;
        const canManage = hasPermission(context.membership.role, "inventory.manage");
        const locationLabel = (locationsResult.data ?? []).find(
          (location) => location.id === adjustment.location_id,
        );
        const skuById = new Map((skusResult.data ?? []).map((sku) => [sku.id, sku]));
        const items: AdjustmentItem[] = (itemsResult.data ?? []).map((item) => {
          const sku = skuById.get(item.sku_id);
          return {
            ...item,
            currency_code: sku?.currency_code ?? null,
            sku_code: sku?.sku_code ?? item.sku_id,
            unit_cost: sku?.approved_unit_cost ?? null,
          };
        });

        return (
          <div className="content-grid">
            {stateNotice(state)}
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/inventory/adjustments">
                  All adjustments
                </Link>
                <Link className="button button-secondary" href="/inventory">
                  Current positions
                </Link>
              </div>
              <h2>{adjustment.reason}</h2>
              <dl className="definition">
                <div><dt>Status</dt><dd><StatusBadge status={adjustment.status} /></dd></div>
                <div><dt>Location</dt><dd>{locationLabel ? `${locationLabel.name} · ${locationLabel.code}` : adjustment.location_id}</dd></div>
                <div><dt>Submitted</dt><dd>{formatRetailDateTime(adjustment.submitted_at)}</dd></div>
                <div><dt>Approved</dt><dd>{adjustment.approved_at ? formatRetailDateTime(adjustment.approved_at) : "Not approved"}</dd></div>
                <div><dt>Executed</dt><dd>{adjustment.executed_at ? formatRetailDateTime(adjustment.executed_at) : "Not executed"}</dd></div>
                <div><dt>Reversed</dt><dd>{adjustment.reversed_at ? formatRetailDateTime(adjustment.reversed_at) : "Not reversed"}</dd></div>
              </dl>
              {canManage ? (
                <div className="actions">
                  {adjustment.status === "pending_approval" ? (
                    <>
                      <form action={approveStockAdjustment}>
                        <input name="adjustmentId" type="hidden" value={adjustment.id} />
                        <button className="button button-primary" type="submit">Approve</button>
                      </form>
                      <form action={rejectStockAdjustment}>
                        <input name="adjustmentId" type="hidden" value={adjustment.id} />
                        <input name="rejectionReason" type="hidden" value="Rejected from Phase 1 workspace" />
                        <button className="button button-secondary" type="submit">Reject</button>
                      </form>
                    </>
                  ) : null}
                  {adjustment.status === "approved" ? (
                    <form action={executeStockAdjustment}>
                      <input name="adjustmentId" type="hidden" value={adjustment.id} />
                      <input name="idempotencyKey" type="hidden" value={executeKey} />
                      <button className="button button-primary" type="submit">Execute adjustment</button>
                    </form>
                  ) : null}
                  {adjustment.status === "executed" ? (
                    <form action={reverseStockAdjustment} className="stack">
                      <input name="adjustmentId" type="hidden" value={adjustment.id} />
                      <input name="idempotencyKey" type="hidden" value={reverseKey} />
                      <label className="field" htmlFor="reversalReason">
                        <span className="field-label">Reversal reason</span>
                        <input id="reversalReason" name="reversalReason" required minLength={3} />
                      </label>
                      <button className="button button-secondary" type="submit">Reverse adjustment</button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </section>
            <section className="panel">
              <h2>Adjustment items</h2>
              <RetailDataGrid
                caption="Adjustment item evidence"
                columns={itemColumns}
                getRowKey={(row) => row.id}
                rows={items}
              />
            </section>
            <section className="panel">
              <h2>Movement ledger</h2>
              <RetailDataGrid
                caption="Adjustment movement ledger entries"
                columns={movementColumns}
                emptyTitle="No movement has been written yet"
                getRowKey={(row) => row.id}
                rows={(movementsResult.data ?? []) as MovementRow[]}
              />
            </section>
          </div>
        );
      }}
    </InventoryPage>
  );
}
