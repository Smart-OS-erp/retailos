import { notFound } from "next/navigation";

import { ProjectPage } from "@/components/project-page";
import { hasPermission } from "@/lib/auth/authorization";

import { createRecoveryProject } from "../../../actions";

type NewProjectPageProps = {
  params: Promise<{ opportunityId: string }>;
};

export default async function NewProjectPage({ params }: NewProjectPageProps) {
  const { opportunityId } = await params;

  return (
    <ProjectPage
      description="RetailOS will snapshot the current opportunity evidence and prepare internal tasks and a proposal-only campaign brief."
      title="Prepare recovery project"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const { data: opportunity } = await context.supabase
          .from("recovery_opportunities")
          .select("id, title, estimated_value, currency_code, rule_version, status")
          .eq("organization_id", organizationId)
          .eq("id", opportunityId)
          .maybeSingle();
        if (!opportunity) notFound();

        return (
          <section className="panel">
            <h2>{opportunity.title}</h2>
            <p className="muted">
              Evidence version: {opportunity.rule_version}. In-scope value:{" "}
              {opportunity.estimated_value.toLocaleString("en-NG")} {opportunity.currency_code}.
            </p>
            {hasPermission(context.membership.role, "project.manage") ? (
              <form action={createRecoveryProject}>
                <input name="opportunityId" type="hidden" value={opportunity.id} />
                <button className="button button-primary" type="submit">
                  Create evidence-bound draft
                </button>
              </form>
            ) : (
              <p className="muted">You do not have project drafting permission.</p>
            )}
          </section>
        );
      }}
    </ProjectPage>
  );
}
