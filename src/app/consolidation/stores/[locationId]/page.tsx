import { notFound } from "next/navigation";

import { ConsolidationPage } from "@/components/consolidation-page";

type StoreOperatingPageProps = {
  params: Promise<{ locationId: string }>;
};

export default async function StoreOperatingPage({
  params,
}: StoreOperatingPageProps) {
  const { locationId } = await params;

  return (
    <ConsolidationPage
      description="Approved current inventory for one authorized location."
      title="Store inventory"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [locationResult, positionsResult] = await Promise.all([
          context.supabase
            .from("locations")
            .select("id, name, code")
            .eq("organization_id", organizationId)
            .eq("id", locationId)
            .maybeSingle(),
          context.supabase
            .from("current_inventory_positions")
            .select("id, sku_code, product_name, on_hand_quantity, approved_unit_cost, currency_code, first_available_at")
            .eq("organization_id", organizationId)
            .eq("location_id", locationId)
            .order("sku_code"),
        ]);
        if (!locationResult.data || locationResult.error) notFound();
        const rows = positionsResult.data ?? [];

        return (
          <section className="panel">
            <h2>{locationResult.data.name}</h2>
            <p className="table-meta">{locationResult.data.code} · {rows.length} visible positions</p>
            {rows.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>SKU</th><th>Product</th><th>On hand</th><th>Cost</th><th>First available</th></tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.sku_code}</td>
                        <td>{row.product_name}</td>
                        <td>{row.on_hand_quantity}</td>
                        <td>{row.approved_unit_cost ?? "Unknown"} {row.currency_code ?? ""}</td>
                        <td>{row.first_available_at ?? "Unknown"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No approved current inventory is visible for this location.</p>
            )}
          </section>
        );
      }}
    </ConsolidationPage>
  );
}
