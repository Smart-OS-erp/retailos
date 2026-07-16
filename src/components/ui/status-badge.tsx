import { Badge } from "@/components/ui/badge";
import { getRetailStatusPresentation } from "@/lib/ui/status";

export function StatusBadge({ status }: { status: string }) {
  const presentation = getRetailStatusPresentation(status);

  return (
    <Badge aria-label={presentation.assistiveLabel} tone={presentation.tone}>
      <span aria-hidden="true" className="ui-status-dot" />
      {presentation.label}
    </Badge>
  );
}
