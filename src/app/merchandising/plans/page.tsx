import { redirect } from "next/navigation";

import {
  addAssortmentItem,
  approvePlanCycle,
  createPlanCycle,
} from "@/app/merchandising/actions";
import { MerchandisingPage } from "@/components/merchandising-page";
import { Notice } from "@/components/notice";
import { RetailDataGrid, type RetailDataGridColumn } from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailDateTime } from "@/lib/ui/market";

type CycleRow = {
  created_at: string;
  cycle_type: string;
  id: string;
  notes: string | null;
  season_label: string;
  status: string;
};

type ProductRow = {
  id: string;
  name: string;
  style_code: string;
};

type Props = {
  searchParams: Promise<{
    cycle_approved?: string;
    cycle_created?: string;
    error?: string;
    item_added?: string;
  }>;
};

const cycleColumns: readonly RetailDataGridColumn<CycleRow>[] = [
  {
    header: "Cycle",
    id: "cycle",
    render: (row) => (
      <>
        <strong>{row.season_label}</strong>
        <span className="table-meta">{row.cycle_type}</span>
      </>
    ),
  },
  { header: "Status", id: "status", render: (row) => <StatusBadge status={row.status} /> },
  { header: "Notes", id: "notes", render: (row) => row.notes ?? "No notes" },
  { header: "Created", id: "created", render: (row) => formatRetailDateTime(row.created_at) },
];

export default async function MerchandisingPlansPage({ searchParams }: Props) {
  const state = await searchParams;

  return (
    <MerchandisingPage
      description="M2.4 assortment and collection planning contracts. Plans can be drafted and approved, but they do not execute buying, transfers, or supplier workflows."
      milestone="M2.4"
      title="Planning cycles"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "merchandising.view")) redirect("/workspace");

        const canManage = hasPermission(context.membership.role, "merchandising.manage");
        const organizationId = context.membership.organization_id;
        const [cyclesResult, productsResult] = await Promise.all([
          context.supabase
            .from("merchandising_plan_cycles")
            .select("id, cycle_type, season_label, status, notes, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(100),
          context.supabase
            .from("products")
            .select("id, name, style_code")
            .eq("organization_id", organizationId)
            .order("name", { ascending: true })
            .limit(100),
        ]);

        if (cyclesResult.error || productsResult.error) redirect("/setup-error?error=setup-state");

        const cycles = (cyclesResult.data ?? []) as CycleRow[];
        const products = (productsResult.data ?? []) as ProductRow[];

        return (
          <div className="content-grid">
            {state.error ? <Notice title="Planning action failed" tone="error">RetailOS failed closed. Check role and plan state.</Notice> : null}
            {state.cycle_created ? <Notice title="Plan cycle created" tone="success">The planning cycle is saved as a draft.</Notice> : null}
            {state.item_added ? <Notice title="Assortment item saved" tone="success">The product role was recorded for the selected plan.</Notice> : null}
            {state.cycle_approved ? <Notice title="Plan cycle approved" tone="success">The cycle is approved for human review/execution outside Phase 2 automation.</Notice> : null}

            {canManage ? (
              <section className="panel">
                <h2>Create planning cycle</h2>
                <form action={createPlanCycle} className="form-grid">
                  <label>
                    Cycle type
                    <select name="cycleType" required>
                      <option value="assortment">Assortment</option>
                      <option value="collection">Collection</option>
                      <option value="markdown">Markdown</option>
                      <option value="allocation">Allocation</option>
                      <option value="replenishment">Replenishment</option>
                    </select>
                  </label>
                  <label>
                    Season / planning label
                    <input name="seasonLabel" placeholder="SS27 Lagos edit" required />
                  </label>
                  <label className="form-full">
                    Notes
                    <textarea name="notes" placeholder="Planning assumption, market, or decision to validate." />
                  </label>
                  <button className="button" type="submit">Create cycle</button>
                </form>
              </section>
            ) : null}

            {canManage && cycles.length && products.length ? (
              <section className="panel">
                <h2>Add assortment item</h2>
                <form action={addAssortmentItem} className="form-grid">
                  <label>
                    Plan cycle
                    <select name="planCycleId" required>
                      {cycles.filter((cycle) => cycle.status !== "approved").map((cycle) => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.season_label} · {cycle.cycle_type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Product
                    <select name="productId" required>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} · {product.style_code}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Product role
                    <select name="productRole" required>
                      <option value="core">Core</option>
                      <option value="carry_forward">Carry forward</option>
                      <option value="test">Test</option>
                      <option value="review">Review</option>
                      <option value="exit">Exit</option>
                    </select>
                  </label>
                  <label>
                    Target location count
                    <input min="0" name="targetLocationCount" type="number" />
                  </label>
                  <label className="form-full">
                    Notes
                    <textarea name="notes" placeholder="Why this role is being proposed." />
                  </label>
                  <button className="button" type="submit">Save assortment item</button>
                </form>
              </section>
            ) : null}

            <section className="panel">
              <RetailDataGrid
                caption="Merchandising planning cycles"
                columns={[
                  ...cycleColumns,
                  ...(canManage
                    ? [{
                        header: "Approve",
                        id: "approve",
                        render: (row: CycleRow) =>
                          row.status === "approved" ? "Approved" : (
                            <form action={approvePlanCycle} className="table-inline-form">
                              <input name="planCycleId" type="hidden" value={row.id} />
                              <button className="button button-secondary" type="submit">Approve</button>
                            </form>
                          ),
                      } satisfies RetailDataGridColumn<CycleRow>]
                    : []),
                ]}
                emptyTitle="No planning cycles yet"
                getRowKey={(row) => row.id}
                rows={cycles}
              />
            </section>
          </div>
        );
      }}
    </MerchandisingPage>
  );
}
