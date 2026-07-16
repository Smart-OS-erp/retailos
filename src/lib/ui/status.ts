export type RetailStatusTone =
  | "attention"
  | "danger"
  | "info"
  | "neutral"
  | "success"
  | "warning";

export type RetailStatusPresentation = Readonly<{
  label: string;
  tone: RetailStatusTone;
  assistiveLabel: string;
}>;

const statusPresentation: Record<string, RetailStatusPresentation> = {
  active: {
    assistiveLabel: "Status is active",
    label: "Active",
    tone: "success",
  },
  approved: {
    assistiveLabel: "Status is approved",
    label: "Approved",
    tone: "success",
  },
  blocked: {
    assistiveLabel: "Status is blocked",
    label: "Blocked",
    tone: "danger",
  },
  completed: {
    assistiveLabel: "Status is completed",
    label: "Completed",
    tone: "success",
  },
  configuration_required: {
    assistiveLabel: "Status requires configuration",
    label: "Configuration required",
    tone: "warning",
  },
  connected: {
    assistiveLabel: "Status is connected",
    label: "Connected",
    tone: "success",
  },
  error: {
    assistiveLabel: "Status has an error",
    label: "Error",
    tone: "danger",
  },
  failed: {
    assistiveLabel: "Status failed",
    label: "Failed",
    tone: "danger",
  },
  missing: {
    assistiveLabel: "Status is missing",
    label: "Missing",
    tone: "attention",
  },
  open: {
    assistiveLabel: "Status is open",
    label: "Open",
    tone: "info",
  },
  pending: {
    assistiveLabel: "Status is pending",
    label: "Pending",
    tone: "warning",
  },
  queued: {
    assistiveLabel: "Status is queued",
    label: "Queued",
    tone: "warning",
  },
  succeeded: {
    assistiveLabel: "Status succeeded",
    label: "Succeeded",
    tone: "success",
  },
  syncing: {
    assistiveLabel: "Status is syncing",
    label: "Syncing",
    tone: "warning",
  },
};

function fallbackLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getRetailStatusPresentation(
  value: string,
): RetailStatusPresentation {
  return (
    statusPresentation[value] ?? {
      assistiveLabel: `Status is ${fallbackLabel(value)}`,
      label: fallbackLabel(value),
      tone: "neutral",
    }
  );
}

export const retailStatusKeys = Object.freeze(Object.keys(statusPresentation));
