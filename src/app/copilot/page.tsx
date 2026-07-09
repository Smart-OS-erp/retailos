import Link from "next/link";

import {
  CopilotAnswerCard,
  toRetailCopilotAnswer,
} from "@/components/copilot-answer-card";
import { CopilotPage } from "@/components/copilot-page";

export default function RetailCopilotWorkspacePage() {
  return (
    <CopilotPage
      description="Deterministic, permission-scoped explanations from live organization evidence. Phase 0 Copilot does not execute actions or call an LLM."
      title="Retail Copilot Workspace"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const [answerResult, activityResult] = await Promise.all([
          context.supabase.rpc("get_retail_copilot_answer", {
            question_category: "morning_brief",
            target_subject_id: null,
          }),
          context.supabase
            .from("copilot_activity_log")
            .select("id, question_category, response_status, response_summary, created_at")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false })
            .limit(6),
        ]);
        const answer = toRetailCopilotAnswer(answerResult.data);
        const activities = activityResult.data ?? [];

        return (
          <div className="content-grid">
            <section className="summary-grid" aria-label="Copilot guardrails">
              <article className="summary-card">
                <span>Mode</span>
                <strong>Deterministic</strong>
              </article>
              <article className="summary-card">
                <span>Scope</span>
                <strong>RBAC + RLS</strong>
              </article>
              <article className="summary-card">
                <span>Execution</span>
                <strong>Read-only</strong>
              </article>
            </section>

            <CopilotAnswerCard answer={answer} />

            <section className="panel">
              <h2>Ask approved Phase 0 questions</h2>
              <p className="muted">
                These surfaces are narrow and allowlisted. Unsupported prompts are
                refused by the database function, not interpreted by a model.
              </p>
              <div className="actions">
                <Link className="button button-secondary" href="/copilot/morning-brief">
                  Morning Brief
                </Link>
                <Link className="button button-secondary" href="/copilot/risk">
                  Explain risk
                </Link>
                <Link className="button button-secondary" href="/copilot/opportunities">
                  Explain opportunity
                </Link>
                <Link className="button button-secondary" href="/copilot/projects">
                  Explain project
                </Link>
              </div>
            </section>

            <section className="panel">
              <h2>My recent Copilot activity</h2>
              {activities.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Status</th>
                        <th>Summary</th>
                        <th>Recorded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity) => (
                        <tr key={activity.id}>
                          <td>{activity.question_category.replaceAll("_", " ")}</td>
                          <td>
                            <span className="status-badge">
                              {activity.response_status.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td>{activity.response_summary}</td>
                          <td>{new Date(activity.created_at).toLocaleString("en-NG")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">
                  No Copilot activity has been recorded for your user yet.
                </p>
              )}
            </section>
          </div>
        );
      }}
    </CopilotPage>
  );
}
