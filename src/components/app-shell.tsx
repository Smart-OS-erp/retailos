import type { ReactNode } from "react";
import Link from "next/link";

import { BrandLockup } from "@/components/brand-lockup";
import { MobileNavigation } from "@/components/mobile-navigation";
import type { OrganizationRole } from "@/lib/auth/authorization";
import { roleWorkspaceLabel } from "@/lib/navigation/onboarding";

type AppShellProps = {
  children: ReactNode;
  email: string;
  organizationName: string;
  role: OrganizationRole;
};

export function AppShell({
  children,
  email,
  organizationName,
  role,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="sidebar">
        <div className="sidebar-inner">
          <BrandLockup href="/onboarding" />
          <div className="tenant-context">
            <span>Active organization</span>
            <strong>{organizationName}</strong>
          </div>
          <nav className="primary-nav" aria-label="Primary">
            <Link className="nav-link nav-link-active" href="/onboarding">
              <svg
                aria-hidden="true"
                className="nav-icon"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 12.5 9.2 17 19 7"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              Setup status
            </Link>
          </nav>
          <div className="session-card">
            <span>{roleWorkspaceLabel(role)}</span>
            <strong>{email}</strong>
            <Link className="button button-secondary" href="/logout">
              Sign out
            </Link>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <MobileNavigation email={email} organizationName={organizationName} />
        <main className="page-frame" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
