import Link from "next/link";
import { redirect } from "next/navigation";

import { DataPage } from "@/components/data-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";
import { csvLimits } from "@/lib/data/csv";

import { loadSampleInventory, uploadInventoryCsv } from "../../actions";

type NewUploadPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  "csv-required": "Choose a file with a .csv extension.",
  "duplicate-upload": "This exact file was already received by the organization.",
  "file-required": "Choose an inventory CSV before submitting.",
  "invalid-csv": "The file could not be parsed safely.",
  "invalid-encoding": "The file must be valid UTF-8 text.",
  "invalid-structure": "The CSV structure or headers are invalid.",
  "location-lookup-failed": "Locations could not be checked safely.",
  "location-required": "Add at least one location before loading sample data.",
  "missing-required-columns": "Use every required inventory column listed below.",
  "too-large": "The file exceeds the two-megabyte intake limit.",
  "too-many-rows": "The file exceeds the 10,000-row intake limit.",
  "unsupported-media-type": "The selected file is not an allowed CSV media type.",
  "upload-create-failed": "RetailOS could not create the intake record.",
  "upload-persistence-failed": "The intake was marked failed because its rows could not be persisted safely.",
};

export default async function NewUploadPage({
  searchParams,
}: NewUploadPageProps) {
  const { error } = await searchParams;

  return (
    <DataPage
      description="CSV is parsed server-side with strict limits. Raw rows are retained for lineage; formulas are neutralized before persistence."
      title="New inventory intake"
    >
      {(context) => {
        if (!hasPermission(context.membership.role, "data.manage")) {
          redirect("/data?error=permission-denied");
        }

        return (
          <div className="content-grid content-grid-two">
            <section className="panel">
              {error ? (
                <Notice title="Intake not accepted" tone="error">
                  {errorMessages[error] ?? "The intake failed closed. Review the file and try again."}
                </Notice>
              ) : null}
              <h2>Inventory CSV</h2>
              <p className="muted">
                Maximum {csvLimits.maxRows.toLocaleString()} rows and{" "}
                {(csvLimits.maxBytes / 1024 / 1024).toFixed(0)} MB. Files are not
                treated as approved inventory until validation and consolidation.
              </p>
              <form action={uploadInventoryCsv} className="stack">
                <label className="field" htmlFor="inventory-file">
                  <span className="field-label">CSV file</span>
                  <input
                    accept=".csv,text/csv"
                    className="file-input"
                    id="inventory-file"
                    name="file"
                    required
                    type="file"
                  />
                </label>
                <button className="button button-primary" type="submit">
                  Parse and validate
                </button>
              </form>
              <div className="panel-actions">
                <Link href="/data/uploads">Cancel</Link>
              </div>
            </section>
            <aside className="panel">
              <h2>Required columns</h2>
              <p className="muted">
                sku_code, product_name, location_code, on_hand_quantity,
                approved_unit_cost, currency_code, first_available_at,
                units_sold_90, units_sold_30
              </p>
              <p className="muted">
                Missing cost, currency, or age evidence creates warnings and
                suppresses unsupported recovery claims.
              </p>
              <form action={loadSampleInventory}>
                <button className="button button-secondary" type="submit">
                  Load tenant-scoped sample
                </button>
              </form>
            </aside>
          </div>
        );
      }}
    </DataPage>
  );
}
