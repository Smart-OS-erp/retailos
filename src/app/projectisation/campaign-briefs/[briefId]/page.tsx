import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectPage } from "@/components/project-page";
import { Notice } from "@/components/notice";
import { hasPermission } from "@/lib/auth/authorization";
import type { Json } from "@/types/database";

import { approveCampaignBrief } from "../../actions";

type CampaignBriefPageProps = {
  params: Promise<{ briefId: string }>;
  searchParams: Promise<{ approved?: string; error?: string }>;
};

function asRecord(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export default async function CampaignBriefPage({
  params,
  searchParams,
}: CampaignBriefPageProps) {
  const { briefId } = await params;
  const state = await searchParams;

  return (
    <ProjectPage
      description="A deterministic internal draft. Approval does not publish, contact customers, alter prices, or reserve stock."
      title="Campaign brief"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const { data: brief } = await context.supabase
          .from("campaign_briefs")
          .select("id, recovery_project_id, status, version, content, evidence_version, created_by")
          .eq("organization_id", organizationId)
          .eq("id", briefId)
          .maybeSingle();
        if (!brief) notFound();
        const content = asRecord(brief.content);
        const constraints = Array.isArray(content.constraints)
          ? content.constraints.filter((item): item is string => typeof item === "string")
          : [];

        return (
          <div className="content-grid">
            {state.error ? (
              <Notice title="Brief approval denied" tone="error">
                The version, parent-project state, permission, or self-approval rule failed.
              </Notice>
            ) : state.approved ? (
              <Notice title="Brief approved" tone="success">
                Approval is recorded, but execution remains outside RetailOS Phase 0.
              </Notice>
            ) : null}
            <section className="panel">
              <dl className="definition">
                <div><dt>Status</dt><dd>{brief.status.replaceAll("_", " ")}</dd></div>
                <div><dt>Objective</dt><dd>{typeof content.objective === "string" ? content.objective : "Unavailable"}</dd></div>
                <div><dt>Audience</dt><dd>{typeof content.audience === "string" ? content.audience : "Unavailable"}</dd></div>
                <div><dt>Proposition</dt><dd>{typeof content.proposition === "string" ? content.proposition : "Unavailable"}</dd></div>
                <div><dt>Value context</dt><dd>{typeof content.value_context === "string" ? content.value_context : "Unavailable"}</dd></div>
                <div><dt>Evidence version</dt><dd>{brief.evidence_version}</dd></div>
              </dl>
              <h2>Constraints</h2>
              <ul>
                {constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}
              </ul>
              <div className="panel-actions">
                <Link href={`/projectisation/projects/${brief.recovery_project_id}`}>Back to project</Link>
                {brief.status === "pending_approval" &&
                hasPermission(context.membership.role, "campaign_brief.approve") &&
                brief.created_by !== context.user.id ? (
                  <form action={approveCampaignBrief}>
                    <input name="briefId" type="hidden" value={brief.id} />
                    <input name="version" type="hidden" value={brief.version} />
                    <button className="button button-primary" type="submit">Approve internal brief</button>
                  </form>
                ) : null}
              </div>
            </section>
          </div>
        );
      }}
    </ProjectPage>
  );
}
