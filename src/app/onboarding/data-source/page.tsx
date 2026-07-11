import { Notice } from "@/components/notice";
import { OnboardingPage } from "@/components/onboarding-page";

import { confirmDataSourceReadiness } from "../actions";

type DataSourcePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DataSourcePage({
  searchParams,
}: DataSourcePageProps) {
  const params = await searchParams;

  return (
    <OnboardingPage
      currentStep="data_source"
      description="Review what trusted data intake means before inventory files are introduced in the next approved milestone."
      title="Prepare your inventory source"
    >
      {(context) => (
        <section className="panel" aria-labelledby="data-source-title">
          <h2 id="data-source-title">Secure intake readiness</h2>
          {params.error ? (
            <Notice title="Acknowledgement required" tone="error">
              Confirm the readiness statement before completing setup.
            </Notice>
          ) : null}
          <Notice title="No file is uploaded on this screen" tone="info">
            Upload, validation, quarantine, and consolidation are separate
            workflows. This step records readiness only.
          </Notice>
          <form action={confirmDataSourceReadiness} className="stack">
            <input
              name="organizationId"
              type="hidden"
              value={context.organization.id}
            />
            <label className="status-row" htmlFor="data-readiness">
              <input
                id="data-readiness"
                name="dataReadiness"
                required
                type="checkbox"
                value="acknowledged"
              />
              <span>
                <strong>I understand files are not trusted on receipt.</strong>
                <span>
                  RetailOS must validate, report issues, and receive explicit
                  consolidation approval before records become canonical.
                </span>
              </span>
            </label>
            <div className="panel-actions">
              <span className="muted">Data readiness 5 of 5</span>
              <button className="button button-primary" type="submit">
                Complete setup review
              </button>
            </div>
          </form>
        </section>
      )}
    </OnboardingPage>
  );
}
