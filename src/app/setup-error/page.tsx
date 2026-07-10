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

        <div className="panel setup-diagnostic" aria-label="Setup diagnostic">
          <h2>What this means</h2>
          <dl className="definition">
            <div>
              <dt>Account status</dt>
              <dd>Your browser has an authenticated RetailOS session.</dd>
            </div>
            <div>
              <dt>Blocked layer</dt>
              <dd>
                RetailOS cannot load the tenant setup records required for the
                Phase 0 preview workspace.
              </dd>
            </div>
            <div>
              <dt>Safe next action</dt>
              <dd>
                Apply and verify the hosted Supabase Phase 0 migrations, then
                retry onboarding with the same account.
              </dd>
            </div>
          </dl>
        </div>

        <div className="actions">
          <Link className="button button-primary" href="/onboarding">
            Retry setup
          </Link>
          <Link className="button button-secondary" href="/create-organization">
            Create organization
          </Link>
          <Link className="button button-secondary" href="/logout">
            Sign out
          </Link>
        </div>

        <p className="help setup-help">
          This page is a fail-closed guardrail, not a product dashboard. It
          prevents redirect loops while the protected preview waits for hosted
          database verification.
        </p>
      </div>
    </AuthShell>
  );
}
