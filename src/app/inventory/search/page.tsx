import Link from "next/link";
import { redirect } from "next/navigation";

import { InventoryPage } from "@/components/inventory-page";
import {
  RetailDataGrid,
  type RetailDataGridColumn,
} from "@/components/ui/retail-data-grid";
import { hasPermission } from "@/lib/auth/authorization";

type InventorySearchProps = {
  searchParams: Promise<{ locationId?: string; q?: string }>;
};

type SearchRow = {
  barcode: string | null;
  location_id: string;
  location_name: string;
  on_hand_quantity: number;
  product_name: string;
  sku_code: string;
  sku_id: string;
};

const columns: readonly RetailDataGridColumn<SearchRow>[] = [
  {
    header: "SKU",
    id: "sku",
    render: (row) => (
      <>
        <strong>{row.sku_code}</strong>
        <span className="table-meta">{row.product_name}</span>
      </>
    ),
  },
  {
    header: "Barcode",
    id: "barcode",
    render: (row) => row.barcode ?? "No barcode",
  },
  {
    header: "Location",
    id: "location",
    render: (row) => row.location_name,
  },
  {
    align: "end",
    header: "On hand",
    id: "on-hand",
    render: (row) => row.on_hand_quantity.toLocaleString(),
  },
];

function validUuid(value: string | undefined) {
  return value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export default async function InventorySearch({
  searchParams,
}: InventorySearchProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const locationId = validUuid(params.locationId);

  return (
    <InventoryPage
      description="Search SKU, barcode, or product name using tenant-scoped inventory records and effective location permissions."
      title="Inventory lookup"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "inventory.view")) {
          redirect("/workspace?error=permission-denied");
        }

        const organizationId = context.membership.organization_id;
        const [locationsResult, searchResult] = await Promise.all([
          context.supabase
            .from("locations")
            .select("id, name, code")
            .eq("organization_id", organizationId)
            .order("name"),
          query
            ? context.supabase.rpc("search_inventory_items", {
                result_limit: 50,
                search_term: query,
                target_location_id: locationId,
              })
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (locationsResult.error || searchResult.error) {
          redirect("/setup-error?error=setup-state");
        }

        const rows = (searchResult.data ?? []) as SearchRow[];

        return (
          <div className="content-grid">
            <section className="panel">
              <form className="stack" role="search">
                <label className="field" htmlFor="q">
                  <span className="field-label">Search term</span>
                  <input
                    defaultValue={query}
                    id="q"
                    minLength={1}
                    name="q"
                    placeholder="SKU, barcode, or product name"
                    required
                    type="search"
                  />
                </label>
                <label className="field" htmlFor="locationId">
                  <span className="field-label">Location scope</span>
                  <select defaultValue={locationId ?? ""} id="locationId" name="locationId">
                    <option value="">All permitted locations</option>
                    {(locationsResult.data ?? []).map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} · {location.code}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button button-primary" type="submit">
                  Search inventory
                </button>
              </form>
              <div className="panel-actions">
                <Link href="/inventory">Current positions</Link>
              </div>
            </section>
            <section className="panel">
              <RetailDataGrid
                caption="Inventory lookup results"
                columns={columns}
                emptyTitle={query ? "No matching inventory items" : "Search for a SKU or barcode"}
                getRowKey={(row) => `${row.sku_id}:${row.location_id}`}
                rows={rows}
              />
            </section>
          </div>
        );
      }}
    </InventoryPage>
  );
}
