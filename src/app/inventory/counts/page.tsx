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

type StockCountListProps = {
  searchParams: Promise<{ error?: string }>;
};

type StockCountRow = {
  counted_at: string;
  id: string;
  location_id: string;
  location_label: string;
  open_issues: number;
  status: string;
};

const columns: readonly RetailDataGridColumn<StockCountRow>[] = [
  {
    header: "Count",
    id: "count",
    render: (row) => (
      <>
        <Link href={`/inventory/counts/${row.id}`}>
          <strong>{formatRetailDateTime(row.counted_at)}</strong>
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
    align: "end",
    header: "Open issues",
    id: "open-issues",
    render: (row) => row.open_issues.toLocaleString(),
  },
];

export default async function StockCountList({
  searchParams,
}: StockCountListProps) {
  const { error } = await searchParams;

  return (
    <InventoryPage
      description="Stock counts record physical count evidence, variances, review, closure, and optional approved count-correction movements."
      title="Store stock counts"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "inventory.view")) {
          redirect("/workspace?error=permission-denied");
        }

        const organizationId = context.membership.organization_id;
        const [countsResult, locationsResult, issuesResult] = await Promise.all([
          context.supabase
            .from("stock_counts")
            .select("id, location_id, status, counted_at")
            .eq("organization_id", organizationId)
            .order("counted_at", { ascending: false })
            .limit(50),
          context.supabase
            .from("locations")
            .select("id, name, code")
            .eq("organization_id", organizationId),
          context.supabase
            .from("reconciliation_issues")
            .select("id, stock_count_id, status")
            .eq("organization_id", organizationId),
        ]);

        if (countsResult.error || locationsResult.error || issuesResult.error) {
          redirect("/setup-error?error=setup-state");
        }

        const locationLabelById = new Map(
          (locationsResult.data ?? []).map((location) => [
            location.id,
            `${location.name} · ${location.code}`,
          ]),
        );
        const openIssuesByCountId = new Map<string, number>();
        for (const issue of issuesResult.data ?? []) {
          if (issue.status !== "open") continue;
          openIssuesByCountId.set(
            issue.stock_count_id,
            (openIssuesByCountId.get(issue.stock_count_id) ?? 0) + 1,
          );
        }
        const rows: StockCountRow[] = (countsResult.data ?? []).map((count) => ({
          ...count,
          location_label: locationLabelById.get(count.location_id) ?? count.location_id,
          open_issues: openIssuesByCountId.get(count.id) ?? 0,
        }));

        return (
          <div className="content-grid">
            {error ? (
              <Notice title="Stock-count action failed" tone="error">
                RetailOS failed closed. Check role, workflow status, issue decisions, and location scope.
              </Notice>
            ) : null}
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/inventory">
                  Current positions
                </Link>
                <Link className="button button-secondary" href="/inventory/watchlist">
                  Watchlist
                </Link>
                {hasPermission(context.membership.role, "stock_count.manage") ? (
                  <Link className="button button-primary" href="/inventory/counts/new">
                    New stock count
                  </Link>
                ) : null}
              </div>
              <RetailDataGrid
                caption="Stock-count review queue"
                columns={columns}
                emptyTitle="No stock counts yet"
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
