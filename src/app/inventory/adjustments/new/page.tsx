import Link from "next/link";
import { redirect } from "next/navigation";

import { createStockAdjustment } from "@/app/inventory/actions";
import { FormField } from "@/components/form-field";
import { InventoryPage } from "@/components/inventory-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";

type NewAdjustmentProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewAdjustment({ searchParams }: NewAdjustmentProps) {
  const { error } = await searchParams;

  return (
    <InventoryPage
      description="Create a single-SKU adjustment request. Execution happens only after approval."
      title="New stock adjustment"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "inventory.manage")) {
          redirect("/inventory/adjustments?error=permission-denied");
        }

        const organizationId = context.membership.organization_id;
        const [locationsResult, skusResult] = await Promise.all([
          context.supabase
            .from("locations")
            .select("id, name, code")
            .eq("organization_id", organizationId)
            .order("name"),
          context.supabase
            .from("skus")
            .select("id, sku_code, products(name)")
            .eq("organization_id", organizationId)
            .order("sku_code")
            .limit(100),
        ]);

        if (locationsResult.error || skusResult.error) {
          redirect("/setup-error?error=setup-state");
        }

        return (
          <div className="content-grid content-grid-two">
            <section className="panel">
              {error ? (
                <Notice title="Adjustment not created" tone="error">
                  Use a valid location, SKU, non-zero quantity delta, and reason.
                </Notice>
              ) : null}
              <form action={createStockAdjustment} className="stack">
                <input name="organizationId" type="hidden" value={organizationId} />
                <label className="field" htmlFor="locationId">
                  <span className="field-label">Location</span>
                  <select id="locationId" name="locationId" required>
                    <option value="">Choose a location</option>
                    {(locationsResult.data ?? []).map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} · {location.code}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field" htmlFor="skuId">
                  <span className="field-label">SKU</span>
                  <select id="skuId" name="skuId" required>
                    <option value="">Choose a SKU</option>
                    {(skusResult.data ?? []).map((sku) => (
                      <option key={sku.id} value={sku.id}>
                        {sku.sku_code}
                      </option>
                    ))}
                  </select>
                </label>
                <FormField
                  help="Use positive numbers to increase stock and negative numbers to reduce stock."
                  label="Quantity delta"
                  name="quantityDelta"
                  required
                  type="number"
                />
                <FormField
                  label="Reason"
                  maxLength={500}
                  minLength={3}
                  name="reason"
                  required
                  type="text"
                />
                <FormField
                  help="Optional item-level evidence."
                  label="Item note"
                  maxLength={500}
                  name="itemReason"
                  type="text"
                />
                <button className="button button-primary" type="submit">
                  Request adjustment
                </button>
              </form>
              <div className="panel-actions">
                <Link href="/inventory/adjustments">Cancel</Link>
              </div>
            </section>
            <aside className="panel">
              <h2>Control rule</h2>
              <p className="muted">
                This page creates an auditable request only. Approved requests
                must still be executed before they affect current balances.
              </p>
            </aside>
          </div>
        );
      }}
    </InventoryPage>
  );
}
