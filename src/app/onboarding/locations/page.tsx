import Link from "next/link";
import { redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { OnboardingPage } from "@/components/onboarding-page";
import { requireUser } from "@/lib/auth/require-user";
import { getOnboardingContext } from "@/lib/navigation/onboarding";
import { displayRetailCode } from "@/lib/retail-code";

import { completeLocationStep, createFirstLocation } from "../actions";

type LocationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const context = await getOnboardingContext();
  if (!context) {
    redirect("/create-organization");
  }

  const { supabase } = await requireUser();
  const { data: locations, error: locationsError } = await supabase
    .from("locations")
    .select("id, name, code, timezone")
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: true });
  const hasLocations = Boolean(locations?.length);
  const showError = Boolean(error) && !hasLocations;

  return (
    <OnboardingPage
      context={context}
      currentStep="first_location"
      description="Add the first operating location so later inventory evidence can carry an explicit place and timezone."
      title="Set your first location"
    >
      {(resolvedContext) => (
        <section className="panel" aria-labelledby="location-title">
          <h2 id="location-title">
            {hasLocations ? "Location recorded" : "Location details"}
          </h2>
          {locationsError ? (
            <Notice title="Location list needs attention" tone="error">
              RetailOS could not read saved locations for this organization.
              Refresh your session and try again.
            </Notice>
          ) : null}
          {showError ? (
            <Notice title="Location needs attention" tone="error">
              {error === "invalid"
                ? "Check the name, code, and timezone."
                : "We could not safely save the location. Use letters, numbers, and hyphens for the code, then try again."}
            </Notice>
          ) : null}

          {hasLocations ? (
            <>
              <dl className="definition">
                {locations?.map((location) => (
                  <div key={location.id}>
                    <dt>{displayRetailCode(location.code)} · {location.timezone}</dt>
                    <dd>{location.name}</dd>
                  </div>
                ))}
              </dl>
              <form action={completeLocationStep} className="panel-actions">
                <input
                  name="organizationId"
                  type="hidden"
                  value={resolvedContext.organization.id}
                />
                <Link className="button button-secondary" href="/onboarding/company">
                  Back to company
                </Link>
                <button className="button button-primary" type="submit">
                  Continue to brands
                </button>
              </form>
            </>
          ) : (
            <form action={createFirstLocation} className="stack">
              <input
                name="organizationId"
                type="hidden"
                value={resolvedContext.organization.id}
              />
              <FormField
                autoComplete="organization-title"
                label="Location name"
                maxLength={120}
                minLength={2}
                name="locationName"
                placeholder="Lekki flagship"
                required
              />
              <FormField
                autoCapitalize="characters"
                help="A short internal code using letters, numbers, and hyphens."
                label="Location code"
                maxLength={32}
                minLength={2}
                name="locationCode"
                pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*"
                placeholder="LAG-LEK"
                required
              />
              <label className="field" htmlFor="timezone">
                <span className="field-label">Operating timezone</span>
                <select defaultValue="Africa/Lagos" id="timezone" name="timezone">
                  <option value="Africa/Accra">Accra</option>
                  <option value="Africa/Johannesburg">Johannesburg</option>
                  <option value="Africa/Lagos">Lagos</option>
                  <option value="Africa/Nairobi">Nairobi</option>
                </select>
              </label>
              <div className="panel-actions">
                <Link className="button button-secondary" href="/onboarding/company">
                  Back to company
                </Link>
                <button className="button button-primary" type="submit">
                  Save location
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </OnboardingPage>
  );
}
