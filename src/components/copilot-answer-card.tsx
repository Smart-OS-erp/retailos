import Link from "next/link";

import type { Json } from "@/types/database";

const PHASE_0_COPILOT_RULE_VERSION = "retailos.phase0.inventory-recovery.v1";

export type RetailCopilotCitation = {
  observed_at?: string;
  record_id: string;
  source_type: string;
};

export type RetailCopilotAnswer = {
  citations: RetailCopilotCitation[];
  executes_actions: boolean;
  facts?: Json;
  heading: string;
  proposed_next_step: string | null;
  rule_version: string;
  status: "answered" | "insufficient_evidence" | "refused";
  summary: string;
};

type CopilotAnswerCardProps = {
  answer: RetailCopilotAnswer;
};

function isRecord(
  value: Json | null | undefined,
): value is Record<string, Json | undefined> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: Json | undefined): string {
  if (value === null || value === undefined) return "Not available";
  if (typeof value === "number") return value.toLocaleString("en-NG");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
  return JSON.stringify(value);
}

function citationHref(citation: RetailCopilotCitation): string {
  switch (citation.source_type) {
    case "recovery_opportunity":
      return `/projectisation/opportunities/${citation.record_id}`;
    case "recovery_project":
      return `/projectisation/projects/${citation.record_id}`;
    case "inventory_risk_insight":
      return "/inventory-recovery/skus";
    case "inventory_position":
      return "/consolidation/operating-view";
    default:
      return "/copilot";
  }
}

export function emptyCopilotAnswer(
  heading: string,
  summary: string,
): RetailCopilotAnswer {
  return {
    citations: [],
    executes_actions: false,
    heading,
    proposed_next_step: "Create approved inventory evidence first.",
    rule_version: PHASE_0_COPILOT_RULE_VERSION,
    status: "insufficient_evidence",
    summary,
  };
}

export function toRetailCopilotAnswer(
  value: Json | null,
  fallback = emptyCopilotAnswer(
    "No Copilot answer available",
    "RetailOS could not produce an evidence-backed answer for this view.",
  ),
): RetailCopilotAnswer {
  if (!isRecord(value)) return fallback;
  const citations = Array.isArray(value.citations)
    ? value.citations.filter(isRecord).map((citation) => {
        const parsed: RetailCopilotCitation = {
          record_id:
            typeof citation.record_id === "string" ? citation.record_id : "unknown",
          source_type:
            typeof citation.source_type === "string" ? citation.source_type : "unknown",
        };
        if (typeof citation.observed_at === "string") {
          parsed.observed_at = citation.observed_at;
        }
        return parsed;
      })
    : [];
  const status =
    value.status === "answered" ||
    value.status === "insufficient_evidence" ||
    value.status === "refused"
      ? value.status
      : fallback.status;

  const answer: RetailCopilotAnswer = {
    citations,
    executes_actions: value.executes_actions === true ? true : false,
    heading: typeof value.heading === "string" ? value.heading : fallback.heading,
    proposed_next_step:
      typeof value.proposed_next_step === "string"
        ? value.proposed_next_step
        : null,
    rule_version:
      typeof value.rule_version === "string"
        ? value.rule_version
        : PHASE_0_COPILOT_RULE_VERSION,
    status,
    summary: typeof value.summary === "string" ? value.summary : fallback.summary,
  };
  if (value.facts !== undefined) {
    answer.facts = value.facts;
  }

  return answer;
}

export function CopilotAnswerCard({ answer }: CopilotAnswerCardProps) {
  const facts = isRecord(answer.facts) ? Object.entries(answer.facts) : [];

  return (
    <section className="panel" aria-label={answer.heading}>
      <div className="data-toolbar">
        <div>
          <span className="status-badge">{answer.status.replaceAll("_", " ")}</span>
          <h2>{answer.heading}</h2>
          <p className="muted">{answer.summary}</p>
        </div>
        <span className="status-badge status-badge-success">
          {answer.executes_actions ? "Action execution" : "Read-only"}
        </span>
      </div>

      {facts.length ? (
        <dl className="definition">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label.replaceAll("_", " ")}</dt>
              <dd>{stringValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="empty-state">
          No additional facts are available beyond the cited records.
        </p>
      )}

      <div className="panel-actions">
        <div>
          <strong>Next workflow action</strong>
          <p className="muted">
            {answer.proposed_next_step ?? "No workflow action is proposed."}
          </p>
        </div>
        <span className="table-meta">Rule version: {answer.rule_version}</span>
      </div>

      <div className="panel-actions">
        <div>
          <strong>Source citations</strong>
          <p className="muted">
            Copilot only renders records returned by the permission-scoped RPC.
          </p>
        </div>
        {answer.citations.length ? (
          <div className="actions">
            {answer.citations.map((citation) => (
              <Link
                className="button button-secondary"
                href={citationHref(citation)}
                key={`${citation.source_type}:${citation.record_id}`}
              >
                {citation.source_type.replaceAll("_", " ")} ·{" "}
                {citation.record_id.slice(0, 8)}
              </Link>
            ))}
          </div>
        ) : (
          <span className="status-badge">No visible citations</span>
        )}
      </div>
    </section>
  );
}
