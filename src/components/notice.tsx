import type { ReactNode } from "react";

type NoticeProps = {
  children: ReactNode;
  title: string;
  tone: "error" | "success" | "info";
};

export function Notice({ children, title, tone }: NoticeProps) {
  return (
    <div
      className={`notice notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
}
