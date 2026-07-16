import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import type { RetailStatusTone } from "@/lib/ui/status";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: Extract<RetailStatusTone, "danger" | "info" | "success" | "warning">;
};

export function Alert({ className, tone = "info", ...props }: AlertProps) {
  return (
    <div
      className={cn("ui-alert", `ui-alert-${tone}`, className)}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    />
  );
}
