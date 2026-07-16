import { Bell, ChevronDown, Search, UserCircle } from "lucide-react";

import type { OrganizationRole } from "@/lib/auth/authorization";
import { roleWorkspaceLabel } from "@/lib/navigation/onboarding";

export function AppTopbar({
  email,
  organizationName,
  role,
}: {
  email: string;
  organizationName: string;
  role: OrganizationRole;
}) {
  return (
    <header className="app-topbar" aria-label="Application toolbar">
      <form className="global-search-shell" role="search">
        <Search aria-hidden="true" className="topbar-icon" />
        <label className="sr-only" htmlFor="global-search">
          Global search
        </label>
        <input
          disabled
          id="global-search"
          placeholder="Global search shell — provisional"
          type="search"
        />
      </form>

      <div className="topbar-actions">
        <button
          aria-label="Notifications shell"
          className="topbar-icon-button"
          disabled
          type="button"
        >
          <Bell aria-hidden="true" className="topbar-icon" />
        </button>
        <button
          aria-label="Organization switcher shell"
          className="organization-switcher"
          disabled
          type="button"
        >
          <span>{organizationName}</span>
          <ChevronDown aria-hidden="true" className="topbar-icon" />
        </button>
        <details className="user-menu-shell">
          <summary>
            <UserCircle aria-hidden="true" className="topbar-icon" />
            <span>{roleWorkspaceLabel(role)}</span>
          </summary>
          <div className="user-menu-panel">
            <strong>{email}</strong>
            <span>M0-UI user menu shell. Account actions remain existing routes.</span>
          </div>
        </details>
      </div>
    </header>
  );
}
