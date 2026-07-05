import { redirect } from "next/navigation";

import { OnboardingPage } from "@/components/onboarding-page";
import {
  nextIncompleteStep,
  roleWorkspaceLabel,
} from "@/lib/navigation/onboarding";

export default function CompletePage() {
  return (
    <OnboardingPage
      currentStep="complete"
      description="The server has confirmed each required or safely skipped setup step for this organization."
      eyebrow="Secure foundation ready"
      title="Your organization setup is ready"
    >
      {(context) => {
        const remainingStep = nextIncompleteStep(context);
        if (remainingStep !== "/onboarding/complete") {
          redirect(remainingStep);
        }

        const workspace = roleWorkspaceLabel(context.membership.role);
        return (
          <div className="content-grid content-grid-two">
            <section className="panel" aria-labelledby="ready-title">
              <span className="role-badge">{workspace}</span>
              <h2 id="ready-title">Foundation checks recorded</h2>
              <p className="muted">
                RetailOS resolved this landing from your active server-side
                membership. No role or organization value was accepted from the
                browser.
              </p>
              <dl className="definition">
                <div>
                  <dt>Organization</dt>
                  <dd>{context.organization.name}</dd>
                </div>
                <div>
                  <dt>Authorized landing</dt>
                  <dd>{workspace}</dd>
                </div>
                <div>
                  <dt>Inventory intelligence</dt>
                  <dd>Not yet activated in this milestone</dd>
                </div>
              </dl>
            </section>
            <aside className="panel" aria-labelledby="next-title">
              <p className="eyebrow">Next safe action</p>
              <h2 id="next-title">Prepare trusted inventory data</h2>
              <p className="muted">
                Data intake appears only after its schema, quarantine, parsing,
                validation, RLS, and hostile-input tests pass together.
              </p>
            </aside>
          </div>
        );
      }}
    </OnboardingPage>
  );
}
