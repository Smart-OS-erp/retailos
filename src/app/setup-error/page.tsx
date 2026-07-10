import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { Notice } from "@/components/notice";

const errorMessages: Record<string, string> = {
  authorization:
    "RetailOS could not verify your organization access. Sign out and retry, or ask an owner to review your membership.",
  "organization-context":
    "RetailOS found more than one active organization membership. Organization switching is not enabled in Phase 0, so the request failed closed.",
  "setup-state":
    "RetailOS could not load the organization setup state for this account. This usually means the hosted database migrations are not fully applied yet.",
};

type SetupErrorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SetupErrorPage({
  searchParams,
}: SetupErrorPageProps) {
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : "setup-state";

  return (
    <AuthShell>
      <div className="auth-card">
        <header className="auth-card-header">
          <p className="eyebrow">Setup needs attention</p>
          <h1>RetailOS could not open your workspace yet</h1>
          <p className="lede">
            Your account may be valid, but the organization setup state is not
            ready for this preview.
          </p>
        </header>

        <Notice title="Workspace setup blocked" tone="error">
          {errorMessages[errorKey] ?? errorMessages["setup-state"]}
        </Notice>

        <div className="actions">
          <Link className="button button-primary" href="/create-organization">
            Try creating an organization
          </Link>
          <Link className="button button-secondary" href="/logout">
            Sign out
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
