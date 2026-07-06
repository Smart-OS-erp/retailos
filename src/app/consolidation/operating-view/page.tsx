import Link from "next/link";

import { ConsolidationPage } from "@/components/consolidation-page";

export default function OperatingViewPage() {
  return (
    <ConsolidationPage
      description="The latest approved inventory snapshot only. Store managers see assigned locations; unknown cost or age remains visibly unknown."
      title="Operating View"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const { data: positions } = await context.supabase
          .from("current_inventory_positions")
          .select("id, sku_code, product_name, location_id, location_name, on_hand_quantity, approved_unit_cost, currency_code, first_available_at, observed_at")
          .eq("organization_id", organizationId)
          .order("location_name", { ascending: true })
          .order("sku_code", { ascending: true })
          .limit(250);
        const rows = positions ?? [];
        const locationCount = new Set(rows.map((row) => row.location_id)).size;
        const units = rows.reduce((sum, row) => sum + row.on_hand_quantity, 0);

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Persisted operating totals">
              <article className="summary-card"><span>Current SKU positions</span><strong>{rows.length}</strong></article>
              <article className="summary-card"><span>Visible locations</span><strong>{locationCount}</strong></article>
              <article className="summary-card"><span>On-hand units</span><strong>{units}</strong></article>
            </section>
            <section className="panel">
              <div className="actions">
                <Link className="button button-secondary" href="/consolidation/entities">Entities and products</Link>
              </div>
              {rows.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>SKU</th><th>Product</th><th>Location</th><th>On hand</th><th>Approved cost</th><th>Age basis</th></tr></thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.sku_code}</td>
                          <td>{row.product_name}</td>
                          <td><Link href={`/consolidation/stores/${row.location_id}`}>{row.location_name}</Link></td>
                          <td>{row.on_hand_quantity}</td>
                          <td>{row.approved_unit_cost ?? "Unknown"} {row.currency_code ?? ""}</td>
                          <td>{row.first_available_at ?? "Unknown"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No approved inventory snapshot is visible.</p>
              )}
            </section>
          </div>
        );
      }}
    </ConsolidationPage>
  );
}
