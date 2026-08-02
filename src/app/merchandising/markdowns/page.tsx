import { redirect } from "next/navigation";

import { createMarkdownDraft } from "@/app/merchandising/actions";
import { MerchandisingPage } from "@/components/merchandising-page";
import { Notice } from "@/components/notice";
import { RetailDataGrid, type RetailDataGridColumn } from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailDateTime } from "@/lib/ui/market";

type DraftRow = {
  confidence_level: string;
  created_at: string;
  id: string;
  reason: string;
  recommended_discount_percent: number;
  status: string;
};

type RecommendationRow = {
  confidence_level: string;
  id: string;
  rationale: string;
  title: string;
};

type Props = {
  searchParams: Promise<{ draft_created?: string; error?: string }>;
};

const draftColumns: readonly RetailDataGridColumn<DraftRow>[] = [
  { header: "Discount", id: "discount", render: (row) => `${row.recommended_discount_percent}%` },
  { header: "Confidence", id: "confidence", render: (row) => <StatusBadge status={row.confidence_level} /> },
  { header: "Status", id: "status", render: (row) => <StatusBadge status={row.status} /> },
  { header: "Reason", id: "reason", render: (row) => row.reason },
  { header: "Created", id: "created", render: (row) => formatRetailDateTime(row.created_at) },
];

export default async function MarkdownPlanningPage({ searchParams }: Props) {
  const state = await searchParams;

  return (
    <MerchandisingPage
      description="M2.3 markdown plans are approval-ready drafts only. RetailOS does not publish discounts or change prices in this phase."
      milestone="M2.3"
      title="Markdown planning drafts"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "merchandising.view")) redirect("/workspace");

        const canManage = hasPermission(context.membership.role, "merchandising.manage");
        const organizationId = context.membership.organization_id;
        const [draftsResult, recommendationsResult] = await Promise.all([
          context.supabase
            .from("markdown_plan_drafts")
            .select("id, recommended_discount_percent, reason, status, confidence_level, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(100),
          context.supabase
            .from("merchandising_recommendations")
            .select("id, title, rationale, confidence_level")
            .eq("organization_id", organizationId)
            .eq("recommendation_type", "markdown")
            .eq("status", "proposed")
            .order("created_at", { ascending: false })
            .limit(25),
        ]);

        if (draftsResult.error || recommendationsResult.error) redirect("/setup-error?error=setup-state");

        const recommendations = (recommendationsResult.data ?? []) as RecommendationRow[];

        return (
          <div className="content-grid">
            {state.error ? <Notice title="Markdown action failed" tone="error">Check role, discount, and recommendation status.</Notice> : null}
            {state.draft_created ? <Notice title="Markdown draft created" tone="success">The draft is ready for review; no price was changed.</Notice> : null}

            {canManage ? (
              <section className="panel">
                <h2>Create draft from recommendation</h2>
                {recommendations.length ? (
                  <form action={createMarkdownDraft} className="form-grid">
                    <label>
                      Recommendation
                      <select name="recommendationId" required>
                        {recommendations.map((recommendation) => (
                          <option key={recommendation.id} value={recommendation.id}>
                            {recommendation.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Discount percent
                      <input defaultValue="15" max="80" min="1" name="discountPercent" type="number" />
                    </label>
                    <label className="form-full">
                      Reason
                      <textarea defaultValue="Historical slow productivity and stock exposure require a controlled markdown review." name="reason" />
                    </label>
                    <button className="button" type="submit">Create markdown draft</button>
                  </form>
                ) : (
                  <p className="empty-state">Generate markdown recommendations before creating a draft.</p>
                )}
              </section>
            ) : null}

            <section className="panel">
              <RetailDataGrid
                caption="Markdown plan drafts"
                columns={draftColumns}
                emptyTitle="No markdown drafts yet"
                getRowKey={(row) => row.id}
                rows={(draftsResult.data ?? []) as DraftRow[]}
              />
            </section>
          </div>
        );
      }}
    </MerchandisingPage>
  );
}
