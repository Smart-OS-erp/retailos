import Link from "next/link";

import {
  CopilotAnswerCard,
  emptyCopilotAnswer,
  toRetailCopilotAnswer,
} from "@/components/copilot-answer-card";
import { CopilotPage } from "@/components/copilot-page";

export default function CopilotProjectsPage() {
  return (
    <CopilotPage
      description="Explain the latest visible recovery project state, approval posture, and safe next action."
      title="Project support"
    >
      {async (context) => {
        const organizationId = context.membership.organization_id;
        const projectResult = await context.supabase
          .from("recovery_projects")
          .select("id, name, status, version, updated_at")
          .eq("organization_id", organizationId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const project = projectResult.data;
        const answerResult = project
          ? await context.supabase.rpc("get_retail_copilot_answer", {
              question_category: "project",
              target_subject_id: project.id,
            })
          : null;
        const answer = answerResult
          ? toRetailCopilotAnswer(answerResult.data)
          : emptyCopilotAnswer(
              "No visible recovery project",
              "RetailOS needs a projectised opportunity before Copilot can explain project state.",
            );

        return (
          <div className="content-grid">
            <CopilotAnswerCard answer={answer} />
            <section className="panel">
              <h2>Selected project</h2>
              {project ? (
                <>
                  <dl className="definition">
                    <div>
                      <dt>Project</dt>
                      <dd>{project.name}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{project.status.replaceAll("_", " ")}</dd>
                    </div>
                    <div>
                      <dt>Version</dt>
                      <dd>{project.version}</dd>
                    </div>
                    <div>
                      <dt>Last updated</dt>
                      <dd>{new Date(project.updated_at).toLocaleString("en-NG")}</dd>
                    </div>
                  </dl>
                  <div className="panel-actions">
                    <Link
                      className="button button-primary"
                      href={`/projectisation/projects/${project.id}`}
                    >
                      Review project record
                    </Link>
                  </div>
                </>
              ) : (
                <p className="empty-state">
                  No recovery project is currently visible for this user.
                </p>
              )}
            </section>
          </div>
        );
      }}
    </CopilotPage>
  );
}
