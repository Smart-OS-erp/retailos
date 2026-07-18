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
  adjustment: {
    assistiveLabel: "Movement is a stock adjustment",
    label: "Adjustment",
    tone: "info",
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
  count_correction: {
    assistiveLabel: "Movement is a count correction",
    label: "Count correction",
    tone: "info",
  },
  closed: {
    assistiveLabel: "Status is closed",
    label: "Closed",
    tone: "success",
  },
  dispatched: {
    assistiveLabel: "Status is dispatched",
    label: "Dispatched",
    tone: "info",
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
  healthy: {
    assistiveLabel: "Status is healthy",
    label: "Healthy",
    tone: "success",
  },
  high: {
    assistiveLabel: "Severity is high",
    label: "High",
    tone: "danger",
  },
  in_transit: {
    assistiveLabel: "Status is in transit",
    label: "In transit",
    tone: "info",
  },
  info: {
    assistiveLabel: "Severity is informational",
    label: "Info",
    tone: "info",
  },
  low: {
    assistiveLabel: "Severity is low",
    label: "Low",
    tone: "info",
  },
  low_stock: {
    assistiveLabel: "Watchlist status is low stock",
    label: "Low stock",
    tone: "warning",
  },
  manual: {
    assistiveLabel: "Watchlist status was saved manually",
    label: "Manual",
    tone: "info",
  },
  medium: {
    assistiveLabel: "Severity is medium",
    label: "Medium",
    tone: "warning",
  },
  open: {
    assistiveLabel: "Status is open",
    label: "Open",
    tone: "info",
  },
  out_of_stock: {
    assistiveLabel: "Watchlist status is out of stock",
    label: "Out of stock",
    tone: "danger",
  },
  overstock: {
    assistiveLabel: "Watchlist status is overstock",
    label: "Overstock",
    tone: "attention",
  },
  pending: {
    assistiveLabel: "Status is pending",
    label: "Pending",
    tone: "warning",
  },
  pending_approval: {
    assistiveLabel: "Status is pending approval",
    label: "Pending approval",
    tone: "warning",
  },
  partially_received: {
    assistiveLabel: "Status is partially received",
    label: "Partially received",
    tone: "warning",
  },
  received: {
    assistiveLabel: "Status is received",
    label: "Received",
    tone: "success",
  },
  rejected: {
    assistiveLabel: "Status is rejected",
    label: "Rejected",
    tone: "danger",
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
  reversed: {
    assistiveLabel: "Status is reversed",
    label: "Reversed",
    tone: "warning",
  },
  reviewed: {
    assistiveLabel: "Status is reviewed",
    label: "Reviewed",
    tone: "info",
  },
  submitted: {
    assistiveLabel: "Status is submitted",
    label: "Submitted",
    tone: "warning",
  },
  transfer_in: {
    assistiveLabel: "Movement is a transfer receipt",
    label: "Transfer in",
    tone: "success",
  },
  transfer_out: {
    assistiveLabel: "Movement is a transfer dispatch",
    label: "Transfer out",
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
