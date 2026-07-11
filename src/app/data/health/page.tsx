import { DataPage } from "@/components/data-page";
import { Notice } from "@/components/notice";

export default function DataHealthPage() {
  return (
    <DataPage
      description="Health is derived from persisted upload and validation records. Unknown evidence stays unknown."
      title="Data health"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [ready, blocked, warnings, positions] = await Promise.all([
          context.supabase
            .from("data_uploads")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("status", "ready"),
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
          context.supabase
            .from("inventory_positions")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId),
        ]);
        const blockedCount = blocked.count ?? 0;
        const warningCount = warnings.count ?? 0;
        const readyCount = ready.count ?? 0;

        return (
          <div className="content-grid">
            {blockedCount > 0 ? (
              <Notice title="Data health: blocked" tone="error">
                Blocking issues prevent consolidation and inventory intelligence.
              </Notice>
            ) : warningCount > 0 ? (
              <Notice title="Data health: review required" tone="info">
                Warnings are present. Affected scores and value claims must remain suppressed.
              </Notice>
            ) : readyCount > 0 ? (
              <Notice title="Data health: ready for consolidation" tone="success">
                At least one intake is clear, but canonical inventory remains unchanged until approval.
              </Notice>
            ) : (
              <Notice title="Data health: no evidence" tone="info">
                Add inventory data before RetailOS can assess recovery risk.
              </Notice>
            )}
            <section className="summary-grid" aria-label="Live data health counts">
              <article className="summary-card"><span>Ready uploads</span><strong>{readyCount}</strong></article>
              <article className="summary-card"><span>Open blockers</span><strong>{blockedCount}</strong></article>
              <article className="summary-card"><span>Canonical positions</span><strong>{positions.count ?? 0}</strong></article>
            </section>
          </div>
        );
      }}
    </DataPage>
  );
}
