import { randomUUID } from "node:crypto";

import Link from "next/link";
import { notFound } from "next/navigation";

import { closeStockCount, reviewStockCount } from "@/app/inventory/actions";
import { InventoryPage } from "@/components/inventory-page";
import { Notice } from "@/components/notice";
import {
  RetailDataGrid,
  type RetailDataGridColumn,
} from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailDateTime } from "@/lib/ui/market";

type StockCountDetailProps = {
  params: Promise<{ countId: string }>;
  searchParams: Promise<{
    closed?: string;
    created?: string;
    error?: string;
    reviewed?: string;
  }>;
};

type CountItem = {
  counted_quantity: number;
  expected_quantity: number;
  id: string;
  sku_code: string;
  sku_id: string;
  variance_quantity: number;
};

type ReconciliationIssue = {
  created_at: string;
  id: string;
  issue_type: string;
  resolution_note: string | null;
  severity: string;
  status: string;
  variance_quantity: number;
};

type MovementRow = {
  created_at: string;
  id: string;
  movement_type: string;
  quantity_after: number | null;
  quantity_before: number | null;
  quantity_delta: number;
  reason: string | null;
};

const itemColumns: readonly RetailDataGridColumn<CountItem>[] = [
  {
    header: "SKU",
    id: "sku",
    render: (row) => row.sku_code,
  },
  {
    align: "end",
    header: "Expected",
    id: "expected",
    render: (row) => row.expected_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "Counted",
    id: "counted",
    render: (row) => row.counted_quantity.toLocaleString(),
  },
  {
    align: "end",
    header: "Variance",
    id: "variance",
    render: (row) => row.variance_quantity.toLocaleString(),
  },
];

const issueColumns: readonly RetailDataGridColumn<ReconciliationIssue>[] = [
  {
    header: "Issue",
    id: "issue",
    render: (row) => row.issue_type.replaceAll("_", " "),
  },
  {
    header: "Severity",
    id: "severity",
    render: (row) => <StatusBadge status={row.severity} />,
  },
  {
    header: "Status",
    id: "status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    align: "end",
    header: "Variance",
    id: "variance",
    render: (row) => row.variance_quantity.toLocaleString(),
  },
  {
    header: "Resolution note",
    id: "resolution-note",
    render: (row) => row.resolution_note ?? "Not resolved",
  },
];

const movementColumns: readonly RetailDataGridColumn<MovementRow>[] = [
  {
    header: "Movement",
    id: "movement",
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

function stateNotice(state: Awaited<StockCountDetailProps["searchParams"]>) {
  if (state.error) {
    return (
      <Notice title="Stock-count transition failed" tone="error">
        RetailOS failed closed. Check status, issue decisions, correction quantity, and location scope.
      </Notice>
    );
  }
  if (state.created) {
    return <Notice title="Stock count submitted" tone="success">Review is required before closure.</Notice>;
  }
  if (state.reviewed) {
    return <Notice title="Stock count reviewed" tone="success">Open issues must be resolved or dismissed before closure.</Notice>;
  }
  if (state.closed) {
    return <Notice title="Stock count closed" tone="success">Closure evidence was audited. Corrections were written only if approved.</Notice>;
  }
  return null;
}

export default async function StockCountDetail({
  params,
  searchParams,
}: StockCountDetailProps) {
  const [{ countId }, state] = await Promise.all([params, searchParams]);
  const closeKey = `stock-count-close-${randomUUID()}`;

  return (
    <InventoryPage
      description="Stock-count detail shows physical evidence, variance review, closure, and any correction movement written to the ledger."
      title="Stock count detail"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [countResult, itemsResult, issuesResult, movementsResult, locationsResult, skusResult] =
          await Promise.all([
            context.supabase
              .from("stock_counts")
              .select(
                "id, location_id, status, counted_at, reviewed_at, review_notes, closed_at, closure_notes",
              )
              .eq("organization_id", organizationId)
              .eq("id", countId)
              .maybeSingle(),
            context.supabase
              .from("stock_count_items")
              .select("id, sku_id, expected_quantity, counted_quantity, variance_quantity")
              .eq("organization_id", organizationId)
              .eq("stock_count_id", countId),
            context.supabase
              .from("reconciliation_issues")
              .select("id, issue_type, severity, status, variance_quantity, resolution_note, created_at")
              .eq("organization_id", organizationId)
              .eq("stock_count_id", countId)
              .order("created_at", { ascending: true }),
            context.supabase
              .from("inventory_movements")
              .select("id, movement_type, quantity_delta, quantity_before, quantity_after, reason, created_at")
              .eq("organization_id", organizationId)
              .eq("source_id", countId)
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

        if (!countResult.data || countResult.error) notFound();
        if (
          itemsResult.error ||
          issuesResult.error ||
          movementsResult.error ||
          locationsResult.error ||
          skusResult.error
        ) {
          notFound();
        }

        const count = countResult.data;
        const canManage = hasPermission(context.membership.role, "stock_count.manage");
        const locationLabel = (locationsResult.data ?? []).find(
          (location) => location.id === count.location_id,
        );
        const skuCodeById = new Map(
          (skusResult.data ?? []).map((sku) => [sku.id, sku.sku_code]),
        );
        const items: CountItem[] = (itemsResult.data ?? []).map((item) => ({
          ...item,
          sku_code: skuCodeById.get(item.sku_id) ?? item.sku_id,
        }));
        const issues = (issuesResult.data ?? []) as ReconciliationIssue[];
        const openIssues = issues.filter((issue) => issue.status === "open");

        return (
          <div className="content-grid">
            {stateNotice(state)}
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/inventory/counts">
                  All stock counts
                </Link>
                <Link className="button button-secondary" href="/inventory">
                  Current positions
                </Link>
              </div>
              <h2>{locationLabel ? `${locationLabel.name} · ${locationLabel.code}` : count.location_id}</h2>
              <dl className="definition">
                <div><dt>Status</dt><dd><StatusBadge status={count.status} /></dd></div>
                <div><dt>Counted</dt><dd>{formatRetailDateTime(count.counted_at)}</dd></div>
                <div><dt>Reviewed</dt><dd>{count.reviewed_at ? formatRetailDateTime(count.reviewed_at) : "Not reviewed"}</dd></div>
                <div><dt>Closed</dt><dd>{count.closed_at ? formatRetailDateTime(count.closed_at) : "Not closed"}</dd></div>
                <div><dt>Review notes</dt><dd>{count.review_notes ?? "No review notes"}</dd></div>
                <div><dt>Closure notes</dt><dd>{count.closure_notes ?? "No closure notes"}</dd></div>
              </dl>
              {canManage && count.status === "submitted" ? (
                <form action={reviewStockCount} className="stack">
                  <input name="countId" type="hidden" value={count.id} />
                  <label className="field" htmlFor="reviewNotes">
                    <span className="field-label">Review notes</span>
                    <textarea id="reviewNotes" maxLength={1000} name="reviewNotes" />
                  </label>
                  <button className="button button-primary" type="submit">
                    Mark reviewed
                  </button>
                </form>
              ) : null}
              {canManage && count.status === "reviewed" ? (
                <form action={closeStockCount} className="stack">
                  <input name="countId" type="hidden" value={count.id} />
                  <input name="idempotencyKey" type="hidden" value={closeKey} />
                  {openIssues.length ? (
                    <div className="content-grid">
                      {openIssues.map((issue) => (
                        <fieldset className="panel" key={issue.id}>
                          <legend>Issue {issue.id}</legend>
                          <input name="issueId" type="hidden" value={issue.id} />
                          <label className="field" htmlFor={`issueStatus-${issue.id}`}>
                            <span className="field-label">Decision</span>
                            <select
                              defaultValue="resolved"
                              id={`issueStatus-${issue.id}`}
                              name="issueStatus"
                              required
                            >
                              <option value="resolved">Resolve and accept count evidence</option>
                              <option value="dismissed">Dismiss without correction</option>
                            </select>
                          </label>
                          <label className="field" htmlFor={`resolutionNote-${issue.id}`}>
                            <span className="field-label">Resolution note</span>
                            <textarea
                              defaultValue="Reviewed from Phase 1 stock-count workflow"
                              id={`resolutionNote-${issue.id}`}
                              maxLength={1000}
                              name="resolutionNote"
                            />
                          </label>
                        </fieldset>
                      ))}
                    </div>
                  ) : null}
                  <label className="checkbox-row">
                    <input name="createCorrections" type="checkbox" />
                    Create count-correction movements for resolved issues
                  </label>
                  <label className="field" htmlFor="closureNotes">
                    <span className="field-label">Closure notes</span>
                    <textarea id="closureNotes" maxLength={1000} name="closureNotes" />
                  </label>
                  <button className="button button-primary" type="submit">
                    Close stock count
                  </button>
                </form>
              ) : null}
            </section>
            <section className="panel">
              <h2>Count items</h2>
              <RetailDataGrid
                caption="Stock-count item evidence"
                columns={itemColumns}
                getRowKey={(row) => row.id}
                rows={items}
              />
            </section>
            <section className="panel">
              <h2>Reconciliation issues</h2>
              <RetailDataGrid
                caption="Stock-count reconciliation issues"
                columns={issueColumns}
                emptyTitle="No variance issues recorded"
                getRowKey={(row) => row.id}
                rows={issues}
              />
            </section>
            <section className="panel">
              <h2>Correction movements</h2>
              <RetailDataGrid
                caption="Stock-count correction ledger entries"
                columns={movementColumns}
                emptyTitle="No count-correction movement written"
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
