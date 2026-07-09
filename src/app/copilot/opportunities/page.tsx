import Link from "next/link";

import {
  CopilotAnswerCard,
  emptyCopilotAnswer,
  toRetailCopilotAnswer,
} from "@/components/copilot-answer-card";
import { CopilotPage } from "@/components/copilot-page";

export default function CopilotOpportunityPage() {
  return (
    <CopilotPage
      description="Explain the highest-priority visible recovery opportunity and the evidence behind the proposed next workflow step."
      title="Opportunity explanation"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const opportunityResult = await context.supabase
          .from("recovery_opportunities")
          .select("id, title, proposed_action, attention_priority_band, recovery_opportunity_score, estimated_value, currency_code")
          .eq("organization_id", organizationId)
          .eq("status", "open")
          .order("attention_priority_score", { ascending: false })
          .limit(1)
          .maybeSingle();
        const opportunity = opportunityResult.data;
        const answerResult = opportunity
          ? await context.supabase.rpc("get_retail_copilot_answer", {
              question_category: "opportunity",
              target_subject_id: opportunity.id,
            })
          : null;
        const answer = answerResult
          ? toRetailCopilotAnswer(answerResult.data)
          : emptyCopilotAnswer(
              "No visible recovery opportunity",
              "RetailOS needs scored, open recovery opportunities before Copilot can explain a projectisation path.",
            );

        return (
          <div className="content-grid">
            <CopilotAnswerCard answer={answer} />
            <section className="panel">
              <h2>Selected opportunity</h2>
              {opportunity ? (
                <>
                  <dl className="definition">
                    <div>
                      <dt>Title</dt>
                      <dd>{opportunity.title}</dd>
                    </div>
                    <div>
                      <dt>Proposal</dt>
                      <dd>{opportunity.proposed_action}</dd>
                    </div>
                    <div>
                      <dt>Estimated value</dt>
                      <dd>
                        {opportunity.estimated_value.toLocaleString("en-NG")}{" "}
                        {opportunity.currency_code}
                      </dd>
                    </div>
                    <div>
                      <dt>Recovery score</dt>
                      <dd>{opportunity.recovery_opportunity_score}/100</dd>
                    </div>
                  </dl>
                  <div className="panel-actions">
                    <Link
                      className="button button-primary"
                      href={`/projectisation/opportunities/${opportunity.id}`}
                    >
                      Review opportunity evidence
                    </Link>
                  </div>
                </>
              ) : (
                <p className="empty-state">
                  No open opportunity is currently visible for this user.
                </p>
              )}
            </section>
          </div>
        );
      }}
    </CopilotPage>
  );
}
