import type { ReactNode } from "react";

import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export type FoundationStateKind =
  | "empty"
  | "error"
  | "forbidden"
  | "loading"
  | "stale"
  | "success";

export function FoundationState({
  action,
  children,
  kind,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  kind: FoundationStateKind;
  title: string;
}) {
  if (kind === "loading") {
    return (
      <div className="ui-state" role="status">
        <Skeleton className="ui-state-skeleton" />
        <div>
          <strong>{title}</strong>
          <p>{children}</p>
        </div>
      </div>
    );
  }

  const tone = kind === "error" || kind === "forbidden" ? "danger" : "info";

  return (
    <Alert className="ui-state" tone={kind === "success" ? "success" : tone}>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
      {action}
    </Alert>
  );
}
