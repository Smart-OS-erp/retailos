import { redirect } from "next/navigation";

import { generateMerchandisingRecommendations } from "@/app/merchandising/actions";
import { MerchandisingPage } from "@/components/merchandising-page";
import { Notice } from "@/components/notice";
import { RetailDataGrid, type RetailDataGridColumn } from "@/components/ui/retail-data-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission } from "@/lib/auth/authorization";
import { formatRetailDateTime } from "@/lib/ui/market";

type Row = {
  confidence_level: string;
  created_at: string;
  id: string;
  rationale: string;
  recommendation_type: string;
  status: string;
  title: string;
};

type Props = {
  searchParams: Promise<{ error?: string; generated?: string }>;
};

const columns: readonly RetailDataGridColumn<Row>[] = [
  {
    header: "Recommendation",
    id: "title",
    render: (row) => (
      <>
        <strong>{row.title}</strong>
        <span className="table-meta">{row.rationale}</span>
      </>
    ),
  },
  { header: "Type", id: "type", render: (row) => <StatusBadge status={row.recommendation_type} /> },
  { header: "Confidence", id: "confidence", render: (row) => <StatusBadge status={row.confidence_level} /> },
  { header: "Status", id: "status", render: (row) => <StatusBadge status={row.status} /> },
  { header: "Created", id: "created", render: (row) => formatRetailDateTime(row.created_at) },
];

export default async function MerchandisingRecommendationsPage({ searchParams }: Props) {
  const state = await searchParams;

  return (
    <MerchandisingPage
      description="M2.5 permissioned planning recommendations. They explain and draft next steps; they do not execute changes."
      milestone="M2.5"
      title="Planning recommendations"
    >
      {async (context) => {
        if (!hasPermission(context.membership.role, "merchandising.view")) redirect("/workspace");

        const canManage = hasPermission(context.membership.role, "merchandising.manage");
        const { data, error } = await context.supabase
          .from("merchandising_recommendations")
          .select("id, recommendation_type, title, rationale, confidence_level, status, created_at")
          .eq("organization_id", context.membership.organization_id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) redirect("/setup-error?error=setup-state");

        return (
          <div className="content-grid">
            {state.error ? (
              <Notice title="Recommendation action failed" tone="error">
                RetailOS failed closed. Check your role and whether merchandising evidence exists.
              </Notice>
            ) : null}
            {state.generated ? (
              <Notice title="Recommendations generated" tone="success">
                Proposed recommendations were regenerated from persisted planning evidence.
              </Notice>
            ) : null}

            <section className="panel">
              <div className="actions">
                {canManage ? (
                  <form action={generateMerchandisingRecommendations}>
                    <button className="button" type="submit">
                      Generate recommendations
                    </button>
                  </form>
                ) : null}
              </div>
              <p className="muted">
                Confidence labels are based on data confidence and observed sales volume. Insufficient data stays visible.
              </p>
              <RetailDataGrid
                caption="Merchandising recommendations"
                columns={columns}
                emptyTitle="No recommendations generated yet"
                getRowKey={(row) => row.id}
                rows={(data ?? []) as Row[]}
              />
            </section>
          </div>
        );
      }}
    </MerchandisingPage>
  );
}
