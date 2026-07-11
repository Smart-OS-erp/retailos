import Link from "next/link";

import { DataPage } from "@/components/data-page";
import { hasPermission } from "@/lib/auth/authorization";

export default function DataOverviewPage() {
  return (
    <DataPage
      description="Only persisted, tenant-scoped records appear here. Intake data remains untrusted until validation is clear."
      title="Data Foundation"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [uploads, blocking, warnings] = await Promise.all([
          context.supabase
            .from("data_uploads")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId),
          context.supabase
            .from("validation_issues")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("severity", "blocking"),
          context.supabase
            .from("validation_issues")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("severity", "warning")
            .is("accepted_at", null),
        ]);
        const canManage = hasPermission(context.membership.role, "data.manage");

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Live data status">
              <article className="summary-card">
                <span>Uploads received</span>
                <strong>{uploads.count ?? 0}</strong>
              </article>
              <article className="summary-card">
                <span>Blocking issues</span>
                <strong>{blocking.count ?? 0}</strong>
              </article>
              <article className="summary-card">
                <span>Warnings awaiting review</span>
                <strong>{warnings.count ?? 0}</strong>
              </article>
            </section>
            <section className="panel">
              <div className="data-toolbar">
                <div>
                  <h2>Trusted intake path</h2>
                  <p className="muted">
                    Upload or load sample inventory, inspect row-level validation,
                    then move to consolidation only when blockers are cleared.
                  </p>
                </div>
                {canManage ? (
                  <Link className="button button-primary" href="/data/uploads/new">
                    Add inventory data
                  </Link>
                ) : null}
              </div>
              <div className="actions">
                <Link className="button button-secondary" href="/data/uploads">
                  Review uploads
                </Link>
                <Link className="button button-secondary" href="/data/validation">
                  Validation issues
                </Link>
                <Link className="button button-secondary" href="/data/health">
                  Data health
                </Link>
              </div>
            </section>
          </div>
        );
      }}
    </DataPage>
  );
}
