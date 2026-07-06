import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectPage } from "@/components/project-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";

type OpportunityPageProps = {
  params: Promise<{ opportunityId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function OpportunityPage({
  params,
  searchParams,
}: OpportunityPageProps) {
  const { opportunityId } = await params;
  const state = await searchParams;

  return (
    <ProjectPage
      description="Review the persisted score, value, source version, and proposal boundary before creating a project."
      title="Recovery opportunity"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [opportunityResult, projectResult] = await Promise.all([
          context.supabase
            .from("recovery_opportunities")
            .select("id, title, proposed_action, status, recovery_opportunity_score, recovery_opportunity_band, attention_priority_score, attention_priority_band, estimated_value, currency_code, rule_version, caveats")
            .eq("organization_id", organizationId)
            .eq("id", opportunityId)
            .maybeSingle(),
          context.supabase
            .from("recovery_projects")
            .select("id, status")
            .eq("organization_id", organizationId)
            .eq("recovery_opportunity_id", opportunityId)
            .maybeSingle(),
        ]);
        if (!opportunityResult.data || opportunityResult.error) notFound();
        const opportunity = opportunityResult.data;

        return (
          <div className="content-grid">
            {state.error ? (
              <Notice title="Project not created" tone="error">
                Permission or evidence validation failed.
              </Notice>
            ) : null}
            <section className="panel">
              <h2>{opportunity.title}</h2>
              <dl className="definition">
                <div><dt>Proposed internal action</dt><dd>{opportunity.proposed_action}</dd></div>
                <div><dt>Recovery Opportunity Score</dt><dd>{opportunity.recovery_opportunity_score} · {opportunity.recovery_opportunity_band}</dd></div>
                <div><dt>Attention Priority Score</dt><dd>{opportunity.attention_priority_score} · {opportunity.attention_priority_band}</dd></div>
                <div><dt>Approved-cost value</dt><dd>{opportunity.estimated_value.toLocaleString("en-NG")} {opportunity.currency_code}</dd></div>
                <div><dt>Rule version</dt><dd>{opportunity.rule_version}</dd></div>
              </dl>
              <p className="muted">Proposal only. Creating a project does not execute pricing, stock, publishing, or customer contact.</p>
              <div className="panel-actions">
                {projectResult.data ? (
                  <Link className="button button-primary" href={`/projectisation/projects/${projectResult.data.id}`}>
                    Open project
                  </Link>
                ) : hasPermission(context.membership.role, "project.manage") ? (
                  <Link className="button button-primary" href={`/projectisation/projects/new/${opportunity.id}`}>
                    Prepare project
                  </Link>
                ) : (
                  <span className="muted">You can review this evidence but cannot create projects.</span>
                )}
              </div>
            </section>
          </div>
        );
      }}
    </ProjectPage>
  );
}
