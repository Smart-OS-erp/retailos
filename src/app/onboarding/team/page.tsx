import { Notice } from "@/components/notice";
import { OnboardingPage } from "@/components/onboarding-page";
import { requireUser } from "@/lib/auth/require-user";

import { continueWithoutTeam } from "../actions";

type TeamPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const params = await searchParams;
  const { supabase } = await requireUser();
  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, role, status")
    .eq("status", "active");

  return (
    <OnboardingPage
      currentStep="team"
      description="Review the active access attached to this organization. Invitations are not enabled in this secure slice."
      title="Review team access"
    >
      {(context) => (
        <section className="panel" aria-labelledby="team-title">
          <h2 id="team-title">Current access</h2>
          {params.error ? (
            <Notice title="Team step needs attention" tone="error">
              We could not safely update this setup step. Try again.
            </Notice>
          ) : null}
          <Notice title="Invitations are intentionally unavailable" tone="info">
            RetailOS will not simulate team invites. The invitation workflow
            needs its dedicated expiry, recipient binding, role, and audit gate.
          </Notice>
          <dl className="definition">
            <div>
              <dt>Active members visible to your role</dt>
              <dd>{memberships?.length ?? 0}</dd>
            </div>
            <div>
              <dt>Your role</dt>
              <dd>Organization owner</dd>
            </div>
          </dl>
          <form action={continueWithoutTeam} className="panel-actions">
            <input
              name="organizationId"
              type="hidden"
              value={context.organization.id}
            />
            <span className="muted">Team 4 of 5</span>
            <button className="button button-primary" type="submit">
              Continue without inviting
            </button>
          </form>
        </section>
      )}
    </OnboardingPage>
  );
}
