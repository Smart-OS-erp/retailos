import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import type { RetailStatusTone } from "@/lib/ui/status";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: RetailStatusTone;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn("ui-badge", `ui-badge-${tone}`, className)} {...props} />;
}
