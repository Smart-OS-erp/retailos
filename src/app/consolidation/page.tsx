import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsolidationPage } from "@/components/consolidation-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";

type ConsolidationHubPageProps = {
  searchParams: Promise<{ error?: string; run?: string }>;
};

export default async function ConsolidationHubPage({
  searchParams,
}: ConsolidationHubPageProps) {
  const state = await searchParams;

  return (
    <ConsolidationPage
      description="Approved intake becomes canonical inventory through an atomic, idempotent, audited transition."
      title="Consolidation control"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "data.view")) {
          redirect("/consolidation/operating-view");
        }
        const organizationId = context.membership.organization_id;
        const [uploadsResult, runsResult] = await Promise.all([
          context.supabase
            .from("data_uploads")
            .select("id, file_name, status, row_count, created_at")
            .eq("organization_id", organizationId)
            .in("status", ["parsed", "ready", "consolidated", "validation_blocked"])
            .order("created_at", { ascending: false })
            .limit(30),
          context.supabase
            .from("consolidation_runs")
            .select("id, upload_id, status, inserted_count, updated_count, source_row_count, completed_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);
        const uploads = uploadsResult.data ?? [];
        const runs = runsResult.data ?? [];
        const readyCount = uploads.filter((upload) => upload.status === "ready").length;
        const blockedCount = uploads.filter(
          (upload) => upload.status === "validation_blocked",
        ).length;

        return (
          <div className="content-grid">
            {state.run ? (
              <Notice title="Consolidation recorded" tone="success">
                The approved source was consolidated with audit and lineage evidence.
              </Notice>
            ) : state.error ? (
              <Notice title="Consolidation unavailable" tone="error">
                The request failed closed. Recheck permission, source state, and validation evidence.
              </Notice>
            ) : null}
            <section className="summary-grid" aria-label="Live consolidation status">
              <article className="summary-card"><span>Ready for approval</span><strong>{readyCount}</strong></article>
              <article className="summary-card"><span>Blocked uploads</span><strong>{blockedCount}</strong></article>
              <article className="summary-card"><span>Completed runs</span><strong>{runs.length}</strong></article>
            </section>
            <section className="panel">
              <div className="data-toolbar">
                <div>
                  <h2>Inventory sources</h2>
                  <p className="muted">Review the source and validation evidence before approving canonical inventory.</p>
                </div>
                <Link className="button button-secondary" href="/consolidation/operating-view">
                  Open Operating View
                </Link>
              </div>
              {uploads.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Source</th><th>Rows</th><th>Status</th><th>Received</th></tr></thead>
                    <tbody>
                      {uploads.map((upload) => (
                        <tr key={upload.id}>
                          <td><Link href={`/data/uploads/${upload.id}`}>{upload.file_name}</Link></td>
                          <td>{upload.row_count}</td>
                          <td><span className="status-badge">{upload.status.replaceAll("_", " ")}</span></td>
                          <td>{new Date(upload.created_at).toLocaleString("en-NG")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No validated inventory source is available.</p>
              )}
            </section>
            <section className="panel">
              <h2>Recent consolidation evidence</h2>
              {runs.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Run</th><th>Source rows</th><th>New SKUs</th><th>Updated SKUs</th><th>Status</th></tr></thead>
                    <tbody>
                      {runs.map((run) => (
                        <tr key={run.id}>
                          <td>{run.id.slice(0, 8)}</td>
                          <td>{run.source_row_count}</td>
                          <td>{run.inserted_count}</td>
                          <td>{run.updated_count}</td>
                          <td><span className="status-badge">{run.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No consolidation has been approved.</p>
              )}
            </section>
          </div>
        );
      }}
    </ConsolidationPage>
  );
}
