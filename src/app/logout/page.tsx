import { AuthShell } from "@/components/auth-shell";
import { requireUser } from "@/lib/auth/require-user";

import { signOut } from "@/app/login/actions";

export default async function LogoutPage() {
  await requireUser();

  return (
    <AuthShell>
      <div className="auth-card">
        <header className="auth-card-header">
          <p className="eyebrow">Session control</p>
          <h1>Sign out of RetailOS?</h1>
          <p className="lede">
            You will need to authenticate again to access organization data.
          </p>
        </header>
        <form action={signOut} className="stack">
          <button className="button button-primary button-full" type="submit">
            Sign out securely
          </button>
          <a className="button button-secondary button-full" href="/onboarding">
            Return to setup
          </a>
        </form>
      </div>
    </AuthShell>
  );
}
