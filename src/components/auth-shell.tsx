import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand-lockup";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="auth-shell">
      <a className="skip-link" href="#auth-form">
        Skip to account form
      </a>
      <section className="auth-story" aria-label="About RetailOS">
        <div className="auth-story-content">
          <BrandLockup />
          <h1>Know what needs attention next.</h1>
          <p>
            RetailOS turns fragmented fashion retail data into secure,
            explainable operating decisions—starting with inventory recovery.
          </p>
        </div>
      </section>
      <section className="auth-form-pane" id="auth-form">
        {children}
      </section>
    </main>
  );
}
