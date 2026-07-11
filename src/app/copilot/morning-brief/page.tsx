import Link from "next/link";

import {
  CopilotAnswerCard,
  toRetailCopilotAnswer,
} from "@/components/copilot-answer-card";
import { CopilotPage } from "@/components/copilot-page";

export default function CopilotMorningBriefPage() {
  return (
    <CopilotPage
      description="A permission-visible briefing from persisted recovery opportunities and open project tasks."
      title="Morning Brief"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [answerResult, opportunitiesResult] = await Promise.all([
          context.supabase.rpc("get_retail_copilot_answer", {
            question_category: "morning_brief",
            target_subject_id: null,
          }),
          context.supabase
            .from("recovery_opportunities")
            .select("id, title, attention_priority_band, estimated_value, currency_code")
            .eq("organization_id", organizationId)
            .eq("status", "open")
            .order("attention_priority_score", { ascending: false })
            .limit(5),
        ]);
        const answer = toRetailCopilotAnswer(answerResult.data);
        const opportunities = opportunitiesResult.data ?? [];

        return (
          <div className="content-grid">
            <CopilotAnswerCard answer={answer} />
            <section className="panel">
              <h2>Visible recovery queue</h2>
              {opportunities.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Opportunity</th>
                        <th>Priority</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((opportunity) => (
                        <tr key={opportunity.id}>
                          <td>
                            <Link href={`/projectisation/opportunities/${opportunity.id}`}>
                              {opportunity.title}
                            </Link>
                          </td>
                          <td>
                            <span className="status-badge">
                              {opportunity.attention_priority_band}
                            </span>
                          </td>
                          <td>
                            {opportunity.estimated_value.toLocaleString("en-NG")}{" "}
                            {opportunity.currency_code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">
                  No open recovery opportunities are visible for your role and location scope.
                </p>
              )}
            </section>
          </div>
        );
      }}
    </CopilotPage>
  );
}
