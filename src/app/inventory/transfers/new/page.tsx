import Link from "next/link";
import { redirect } from "next/navigation";

import { createTransferRequest } from "@/app/inventory/actions";
import { FormField } from "@/components/form-field";
import { InventoryPage } from "@/components/inventory-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";

type NewTransferProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewTransfer({ searchParams }: NewTransferProps) {
  const { error } = await searchParams;

  return (
    <InventoryPage
      description="Create a single-SKU transfer request. Approval reserves stock; dispatch moves it into transit."
      title="New stock transfer"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "transfer.manage")) {
          redirect("/inventory/transfers?error=permission-denied");
        }

        const organizationId = context.membership.organization_id;
        const [locationsResult, balancesResult] = await Promise.all([
          context.supabase
            .from("locations")
            .select("id, name, code")
            .eq("organization_id", organizationId)
            .order("name"),
          context.supabase
            .from("current_inventory_balances")
            .select("sku_id, sku_code, product_name, location_name, location_code, available_quantity")
            .eq("organization_id", organizationId)
            .gt("available_quantity", 0)
            .order("sku_code")
            .limit(100),
        ]);

        if (locationsResult.error || balancesResult.error) {
          redirect("/setup-error?error=setup-state");
        }

        return (
          <div className="content-grid content-grid-two">
            <section className="panel">
              {error ? (
                <Notice title="Transfer not created" tone="error">
                  Use different locations, an available SKU, a positive quantity, and a reason.
                </Notice>
              ) : null}
              <form action={createTransferRequest} className="stack">
                <input name="organizationId" type="hidden" value={organizationId} />
                <label className="field" htmlFor="originLocationId">
                  <span className="field-label">Origin location</span>
                  <select id="originLocationId" name="originLocationId" required>
                    <option value="">Choose origin</option>
                    {(locationsResult.data ?? []).map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} · {location.code}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field" htmlFor="destinationLocationId">
                  <span className="field-label">Destination location</span>
                  <select id="destinationLocationId" name="destinationLocationId" required>
                    <option value="">Choose destination</option>
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
                    <option value="">Choose a SKU with available stock</option>
                    {(balancesResult.data ?? []).map((balance) => (
                      <option
                        key={`${balance.sku_id}:${balance.location_code}`}
                        value={balance.sku_id}
                      >
                        {balance.sku_code} · {balance.product_name} · {balance.location_name} available {balance.available_quantity}
                      </option>
                    ))}
                  </select>
                </label>
                <FormField label="Quantity" min={1} name="quantity" required type="number" />
                <FormField
                  label="Reason"
                  maxLength={500}
                  minLength={3}
                  name="reason"
                  required
                  type="text"
                />
                <button className="button button-primary" type="submit">
                  Request transfer
                </button>
              </form>
              <div className="panel-actions">
                <Link href="/inventory/transfers">Cancel</Link>
              </div>
            </section>
            <aside className="panel">
              <h2>Transfer lifecycle</h2>
              <p className="muted">
                Request → approve/reserve → dispatch/outbound movement →
                receive/inbound movement → discrepancy reconciliation.
              </p>
            </aside>
          </div>
        );
      }}
    </InventoryPage>
  );
}
