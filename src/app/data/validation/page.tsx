import Link from "next/link";

import { DataPage } from "@/components/data-page";

export default function ValidationIssuesPage() {
  return (
    <DataPage
      description="Blocking issues cannot be waived. Warnings remain visible and suppress claims that lack sufficient evidence."
      title="Validation issues"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const { data: issues } = await context.supabase
          .from("validation_issues")
          .select("id, upload_id, severity, issue_code, message, accepted_at, created_at")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(100);

        return (
          <section className="panel">
            {issues?.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Severity</th><th>Issue</th><th>Message</th><th>Upload</th></tr></thead>
                  <tbody>
                    {issues.map((issue) => (
                      <tr key={issue.id}>
                        <td><span className="status-badge">{issue.severity}</span></td>
                        <td>{issue.issue_code}</td>
                        <td>{issue.message}</td>
                        <td><Link href={`/data/uploads/${issue.upload_id}`}>Review source</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No validation issues have been recorded.</p>
            )}
          </section>
        );
      }}
    </DataPage>
  );
}
