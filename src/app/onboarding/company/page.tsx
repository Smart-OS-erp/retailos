import { OnboardingPage } from "@/components/onboarding-page";
import { Notice } from "@/components/notice";

import { completeCompanyProfile } from "../actions";

type CompanyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompanyPage({ searchParams }: CompanyPageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const created = params.created === "1";

  return (
    <OnboardingPage
      currentStep="company_profile"
      description="Confirm the tenant identity created by the secure organization workflow."
      title="Check your company profile"
    >
      {(context) => (
        <div className="content-grid content-grid-two">
          <section className="panel" aria-labelledby="company-details-title">
            <h2 id="company-details-title">Organization identity</h2>
            <p className="muted">
              This identity is read from the organization record visible to
              your authenticated membership.
            </p>
            {created ? (
              <Notice title="Organization created" tone="success">
                Your owner membership and audit event were created with it.
              </Notice>
            ) : null}
            {error ? (
              <Notice title="Setup state needs attention" tone="error">
                We could not safely update this step. Refresh your session and
                try again.
              </Notice>
            ) : null}
            <dl className="definition">
              <div>
                <dt>Organization</dt>
                <dd>{context.organization.name}</dd>
              </div>
              <div>
                <dt>URL identifier</dt>
                <dd>{context.organization.slug}</dd>
              </div>
              <div>
                <dt>Your access</dt>
                <dd>Organization owner</dd>
              </div>
            </dl>
            <form action={completeCompanyProfile} className="panel-actions">
              <input
                name="organizationId"
                type="hidden"
                value={context.organization.id}
              />
              <span className="muted">Company profile 1 of 5</span>
              <button className="button button-primary" type="submit">
                Confirm and continue
              </button>
            </form>
          </section>
          <aside className="panel" aria-labelledby="security-title">
            <p className="eyebrow">Security boundary</p>
            <h2 id="security-title">Your access is checked twice</h2>
            <p className="muted">
              RetailOS verifies your session on the server, then Supabase row
              policies limit which organization records can be returned.
            </p>
          </aside>
        </div>
      )}
    </OnboardingPage>
  );
}
