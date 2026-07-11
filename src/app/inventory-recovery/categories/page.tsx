import { IntelligencePage } from "@/components/intelligence-page";

export default function CategoryIntelligencePage() {
  return (
    <IntelligencePage
      description="Category coverage is derived from canonical products in the current approved snapshot."
      title="Category recovery"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [positionsResult, productsResult, categoriesResult] = await Promise.all([
          context.supabase
            .from("current_inventory_positions")
            .select("id, product_id, on_hand_quantity")
            .eq("organization_id", organizationId),
          context.supabase
            .from("products")
            .select("id, category_id")
            .eq("organization_id", organizationId),
          context.supabase
            .from("categories")
            .select("id, name")
            .eq("organization_id", organizationId),
        ]);
        const categoryByProduct = new Map(
          (productsResult.data ?? []).map((product) => [product.id, product.category_id]),
        );
        const categoryNames = new Map(
          (categoriesResult.data ?? []).map((category) => [category.id, category.name]),
        );
        const totals = new Map<string, { positions: number; units: number }>();
        for (const position of positionsResult.data ?? []) {
          const categoryId = categoryByProduct.get(position.product_id) ?? null;
          const label = categoryId ? categoryNames.get(categoryId) ?? "Restricted" : "Unclassified";
          const current = totals.get(label) ?? { positions: 0, units: 0 };
          current.positions += 1;
          current.units += position.on_hand_quantity;
          totals.set(label, current);
        }

        return (
          <section className="panel">
            {totals.size ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Category</th><th>Positions</th><th>On-hand units</th></tr></thead>
                  <tbody>
                    {[...totals.entries()].sort().map(([label, total]) => (
                      <tr key={label}><td>{label}</td><td>{total.positions}</td><td>{total.units}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No approved category inventory is visible.</p>
            )}
          </section>
        );
      }}
    </IntelligencePage>
  );
}
