import { notFound } from "next/navigation";

import { DataPage } from "@/components/data-page";
import { Notice } from "@/components/notice";

type UploadDetailPageProps = {
  params: Promise<{ uploadId: string }>;
};

export default async function UploadDetailPage({
  params,
}: UploadDetailPageProps) {
  const { uploadId } = await params;

  return (
    <DataPage
      description="Source metadata, normalized staging values, and validation evidence are shown without treating them as consolidated truth."
      title="Upload review"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [uploadResult, stagingResult, issuesResult] = await Promise.all([
          context.supabase
            .from("data_uploads")
            .select("id, file_name, upload_type, status, row_count, byte_size, created_at")
            .eq("organization_id", organizationId)
            .eq("id", uploadId)
            .maybeSingle(),
          context.supabase
            .from("staging_inventory_rows")
            .select("id, sku_code, location_code, on_hand_quantity, approved_unit_cost, currency_code, validation_status")
            .eq("organization_id", organizationId)
            .eq("upload_id", uploadId)
            .order("created_at", { ascending: true })
            .limit(100),
          context.supabase
            .from("validation_issues")
            .select("id, staging_row_id, severity, issue_code, message, accepted_at")
            .eq("organization_id", organizationId)
            .eq("upload_id", uploadId)
            .order("created_at", { ascending: true }),
        ]);
        if (!uploadResult.data || uploadResult.error) notFound();
        const upload = uploadResult.data;
        const issues = issuesResult.data ?? [];
        const blocking = issues.filter((issue) => issue.severity === "blocking").length;
        const warnings = issues.filter((issue) => issue.severity === "warning").length;

        return (
          <div className="content-grid">
            {blocking > 0 ? (
              <Notice title="Consolidation blocked" tone="error">
                {blocking} blocking issue{blocking === 1 ? "" : "s"} must be fixed in a new intake.
              </Notice>
            ) : warnings > 0 ? (
              <Notice title="Warnings require review" tone="info">
                {warnings} warning{warnings === 1 ? "" : "s"} suppress unsupported intelligence until reviewed.
              </Notice>
            ) : (
              <Notice title="Validation clear" tone="success">
                No blocking issues or warnings were detected. Consolidation is a separate approval step.
              </Notice>
            )}
            <section className="summary-grid" aria-label="Upload summary">
              <article className="summary-card"><span>Rows</span><strong>{upload.row_count}</strong></article>
              <article className="summary-card"><span>Blocking</span><strong>{blocking}</strong></article>
              <article className="summary-card"><span>Warnings</span><strong>{warnings}</strong></article>
            </section>
            <section className="panel">
              <h2>{upload.file_name}</h2>
              <p className="table-meta">
                {upload.upload_type.replaceAll("_", " ")} · {upload.byte_size.toLocaleString()} bytes · {upload.status.replaceAll("_", " ")}
              </p>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>SKU</th><th>Location</th><th>On hand</th><th>Cost</th><th>Status</th></tr></thead>
                  <tbody>
                    {(stagingResult.data ?? []).map((row) => (
                      <tr key={row.id}>
                        <td>{row.sku_code ?? "Missing"}</td>
                        <td>{row.location_code ?? "Missing"}</td>
                        <td>{row.on_hand_quantity ?? "Invalid"}</td>
                        <td>{row.approved_unit_cost ?? "Unknown"} {row.currency_code ?? ""}</td>
                        <td><span className="status-badge">{row.validation_status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            {issues.length ? (
              <section className="panel">
                <h2>Validation evidence</h2>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Severity</th><th>Rule</th><th>Message</th></tr></thead>
                    <tbody>
                      {issues.map((issue) => (
                        <tr key={issue.id}>
                          <td><span className="status-badge">{issue.severity}</span></td>
                          <td>{issue.issue_code}</td>
                          <td>{issue.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </div>
        );
      }}
    </DataPage>
  );
}
