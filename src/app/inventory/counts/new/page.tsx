import Link from "next/link";
import { redirect } from "next/navigation";

import { submitStockCount } from "@/app/inventory/actions";
import { FormField } from "@/components/form-field";
import { InventoryPage } from "@/components/inventory-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";

type NewStockCountProps = {
  searchParams: Promise<{ error?: string }>;
};

type BalanceOption = {
  available_quantity: number;
  location_id: string;
  location_name: string;
  location_code: string;
  on_hand_quantity: number;
  product_name: string;
  sku_code: string;
  sku_id: string;
};

export default async function NewStockCount({
  searchParams,
}: NewStockCountProps) {
  const { error } = await searchParams;

  return (
    <InventoryPage
      description="Submit a single-SKU physical count. Variance issues are created from the submitted evidence and reviewed before closure."
      title="New store stock count"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "stock_count.manage")) {
          redirect("/inventory/counts?error=permission-denied");
        }

        const organizationId = context.membership.organization_id;
        const balancesResult = await context.supabase
          .from("current_inventory_balances")
          .select(
            "location_id, location_name, location_code, sku_id, sku_code, product_name, on_hand_quantity, available_quantity",
          )
          .eq("organization_id", organizationId)
          .order("location_name", { ascending: true })
          .order("sku_code", { ascending: true })
          .limit(200);

        if (balancesResult.error) {
          redirect("/setup-error?error=setup-state");
        }

        const balances = (balancesResult.data ?? []) as BalanceOption[];

        return (
          <div className="content-grid content-grid-two">
            <section className="panel">
              {error ? (
                <Notice title="Stock count not submitted" tone="error">
                  Choose a valid location/SKU pair and non-negative expected and counted quantities.
                </Notice>
              ) : null}
              <form action={submitStockCount} className="stack">
                <input name="organizationId" type="hidden" value={organizationId} />
                <label className="field" htmlFor="positionKey">
                  <span className="field-label">Current position</span>
                  <select id="positionKey" name="positionKey" required>
                    <option value="">Use this list to choose a live persisted position</option>
                    {balances.map((balance) => (
                      <option
                        key={`${balance.location_id}:${balance.sku_id}`}
                        value={`${balance.location_id}:${balance.sku_id}:${balance.on_hand_quantity}`}
                      >
                        {balance.location_name} · {balance.sku_code} · expected{" "}
                        {balance.on_hand_quantity.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </label>
                <FormField
                  help="Optional. Leave blank to use the current on-hand quantity from the selected persisted position."
                  label="Expected quantity"
                  min={0}
                  name="expectedQuantity"
                  type="number"
                />
                <FormField
                  help="The physical count observed by the store team."
                  label="Counted quantity"
                  min={0}
                  name="countedQuantity"
                  required
                  type="number"
                />
                <button className="button button-primary" type="submit">
                  Submit stock count
                </button>
              </form>
              <div className="panel-actions">
                <Link href="/inventory/counts">Cancel</Link>
              </div>
            </section>
            <aside className="panel">
              <h2>Count control rule</h2>
              <p className="muted">
                Submission records evidence only. Variances must be reviewed and closed before optional
                count-correction movements affect the ledger.
              </p>
            </aside>
          </div>
        );
      }}
    </InventoryPage>
  );
}
