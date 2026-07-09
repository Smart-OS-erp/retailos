import {
  CopilotAnswerCard,
  emptyCopilotAnswer,
  toRetailCopilotAnswer,
} from "@/components/copilot-answer-card";
import { CopilotPage } from "@/components/copilot-page";

export default function CopilotRiskPage() {
  return (
    <CopilotPage
      description="Explain the highest-priority visible inventory risk using persisted score evidence and source citations."
      title="Risk explanation"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const riskResult = await context.supabase
          .from("inventory_risk_insights")
          .select("id, inventory_risk_band, inventory_risk_score, attention_priority_score, suppression_reason")
          .eq("organization_id", organizationId)
          .order("attention_priority_score", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();
        const risk = riskResult.data;
        const answerResult = risk
          ? await context.supabase.rpc("get_retail_copilot_answer", {
              question_category: "inventory_risk",
              target_subject_id: risk.id,
            })
          : null;
        const answer = answerResult
          ? toRetailCopilotAnswer(answerResult.data)
          : emptyCopilotAnswer(
              "No visible inventory risk",
              "RetailOS needs an approved inventory snapshot and an intelligence run before Copilot can explain risk.",
            );

        return (
          <div className="content-grid">
            <CopilotAnswerCard answer={answer} />
            <section className="panel">
              <h2>Selected risk evidence</h2>
              {risk ? (
                <dl className="definition">
                  <div>
                    <dt>Risk band</dt>
                    <dd>{risk.inventory_risk_band ?? "Unknown"}</dd>
                  </div>
                  <div>
                    <dt>Risk score</dt>
                    <dd>{risk.inventory_risk_score ?? "Not scored"}</dd>
                  </div>
                  <div>
                    <dt>Suppression reason</dt>
                    <dd>{risk.suppression_reason ?? "None"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="empty-state">
                  No risk record is currently visible for this user.
                </p>
              )}
            </section>
          </div>
        );
      }}
    </CopilotPage>
  );
}
