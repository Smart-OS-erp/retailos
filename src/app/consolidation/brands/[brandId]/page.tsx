import { notFound } from "next/navigation";

import { ConsolidationPage } from "@/components/consolidation-page";

type BrandOperatingPageProps = {
  params: Promise<{ brandId: string }>;
};

export default async function BrandOperatingPage({
  params,
}: BrandOperatingPageProps) {
  const { brandId } = await params;

  return (
    <ConsolidationPage
      description="Current approved positions for one authorized brand."
      title="Brand inventory"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [brandResult, positionsResult] = await Promise.all([
          context.supabase
            .from("brands")
            .select("id, name, code")
            .eq("organization_id", organizationId)
            .eq("id", brandId)
            .maybeSingle(),
          context.supabase
            .from("current_inventory_positions")
            .select("id, sku_code, product_name, location_name, on_hand_quantity, approved_unit_cost, currency_code")
            .eq("organization_id", organizationId)
            .eq("brand_id", brandId)
            .order("sku_code"),
        ]);
        if (!brandResult.data || brandResult.error) notFound();
        const rows = positionsResult.data ?? [];

        return (
          <section className="panel">
            <h2>{brandResult.data.name}</h2>
            <p className="table-meta">{brandResult.data.code} · {rows.length} visible positions</p>
            {rows.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>SKU</th><th>Product</th><th>Location</th><th>On hand</th><th>Cost</th></tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.sku_code}</td>
                        <td>{row.product_name}</td>
                        <td>{row.location_name}</td>
                        <td>{row.on_hand_quantity}</td>
                        <td>{row.approved_unit_cost ?? "Unknown"} {row.currency_code ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No approved current inventory is visible for this brand.</p>
            )}
          </section>
        );
      }}
    </ConsolidationPage>
  );
}
