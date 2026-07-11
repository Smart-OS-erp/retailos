import Link from "next/link";

import { DataPage } from "@/components/data-page";
import { hasPermission } from "@/lib/auth/authorization";

export default function UploadsPage() {
  return (
    <DataPage
      description="Every intake keeps its source identity, checksum, row count, validation state, and organization scope."
      title="Uploads"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const { data: uploads } = await context.supabase
          .from("data_uploads")
          .select("id, file_name, upload_type, status, row_count, created_at")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(50);

        return (
          <section className="panel">
            <div className="data-toolbar">
              <p className="table-meta">
                Showing the latest {uploads?.length ?? 0} organization uploads.
              </p>
              {hasPermission(context.membership.role, "data.manage") ? (
                <Link className="button button-primary" href="/data/uploads/new">
                  New intake
                </Link>
              ) : null}
            </div>
            {uploads?.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Type</th>
                      <th>Rows</th>
                      <th>Status</th>
                      <th>Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploads.map((upload) => (
                      <tr key={upload.id}>
                        <td>
                          <Link href={`/data/uploads/${upload.id}`}>
                            {upload.file_name}
                          </Link>
                        </td>
                        <td>{upload.upload_type.replaceAll("_", " ")}</td>
                        <td>{upload.row_count}</td>
                        <td>
                          <span className="status-badge">{upload.status.replaceAll("_", " ")}</span>
                        </td>
                        <td>{new Date(upload.created_at).toLocaleString("en-NG")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No inventory intake has been recorded yet.</p>
            )}
          </section>
        );
      }}
    </DataPage>
  );
}
