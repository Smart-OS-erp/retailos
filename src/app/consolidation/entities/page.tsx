import { ConsolidationPage } from "@/components/consolidation-page";

export default function EntitiesPage() {
  return (
    <ConsolidationPage
      description="Canonical organization products and SKUs created from approved intake lineage."
      title="Entities and products"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [entitiesResult, productsResult, skusResult] = await Promise.all([
          context.supabase
            .from("entities")
            .select("id, name, entity_type")
            .eq("organization_id", organizationId)
            .order("name"),
          context.supabase
            .from("products")
            .select("id, name, style_code, brand_id")
            .eq("organization_id", organizationId)
            .order("name")
            .limit(100),
          context.supabase
            .from("skus")
            .select("id, sku_code, product_id, approved_unit_cost, currency_code")
            .eq("organization_id", organizationId)
            .order("sku_code")
            .limit(200),
        ]);
        const entities = entitiesResult.data ?? [];
        const products = productsResult.data ?? [];
        const skus = skusResult.data ?? [];

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Canonical record counts">
              <article className="summary-card"><span>Entities</span><strong>{entities.length}</strong></article>
              <article className="summary-card"><span>Products</span><strong>{products.length}</strong></article>
              <article className="summary-card"><span>SKUs</span><strong>{skus.length}</strong></article>
            </section>
            <section className="panel">
              <h2>Canonical SKUs</h2>
              {skus.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>SKU</th><th>Approved cost</th><th>Product record</th></tr></thead>
                    <tbody>
                      {skus.map((sku) => (
                        <tr key={sku.id}>
                          <td>{sku.sku_code}</td>
                          <td>{sku.approved_unit_cost ?? "Unknown"} {sku.currency_code ?? ""}</td>
                          <td>{sku.product_id.slice(0, 8)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No canonical SKU exists until a validated intake is approved.</p>
              )}
            </section>
          </div>
        );
      }}
    </ConsolidationPage>
  );
}
