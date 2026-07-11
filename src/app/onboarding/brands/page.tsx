import Link from "next/link";
import { redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { OnboardingPage } from "@/components/onboarding-page";
import { requireUser } from "@/lib/auth/require-user";
import { getOnboardingContext } from "@/lib/navigation/onboarding";
import { displayRetailCode } from "@/lib/retail-code";

import {
  addBrandAndContinue,
  completeBrandsStep,
  skipBrands,
} from "../actions";

type BrandsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const context = await getOnboardingContext();
  if (!context) {
    redirect("/create-organization");
  }

  const { supabase } = await requireUser();
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, code")
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: true });
  const hasBrands = Boolean(brands?.length);
  const showError = Boolean(error) && !hasBrands;

  return (
    <OnboardingPage
      context={context}
      currentStep="brands"
      description="Record a brand identity now, or safely skip this optional step and return later."
      title="Add the brands you operate"
    >
      {(context) => (
        <section className="panel" aria-labelledby="brand-title">
          <h2 id="brand-title">
            {hasBrands ? "Brands recorded" : "First brand"}
          </h2>
          {showError ? (
            <Notice title="Brand needs attention" tone="error">
              {error === "invalid"
                ? "Check the brand name and code."
                : "We could not safely save that brand. Use letters, numbers, and hyphens for the code, then try again."}
            </Notice>
          ) : null}
          {hasBrands ? (
            <>
              <dl className="definition">
                {brands?.map((brand) => (
                  <div key={brand.id}>
                    <dt>{displayRetailCode(brand.code)}</dt>
                    <dd>{brand.name}</dd>
                  </div>
                ))}
              </dl>
              <form action={completeBrandsStep} className="panel-actions">
                <input
                  name="organizationId"
                  type="hidden"
                  value={context.organization.id}
                />
                <Link className="button button-secondary" href="/onboarding/locations">
                  Back to locations
                </Link>
                <button className="button button-primary" type="submit">
                  Continue to team
                </button>
              </form>
            </>
          ) : (
            <form action={addBrandAndContinue} className="stack">
              <input
                name="organizationId"
                type="hidden"
                value={context.organization.id}
              />
              <FormField
                label="Brand name"
                maxLength={120}
                minLength={2}
                name="brandName"
                placeholder="Adebayo Studio"
                required
              />
              <FormField
                autoCapitalize="characters"
                help="A short internal code using letters, numbers, and hyphens."
                label="Brand code"
                maxLength={32}
                minLength={2}
                name="brandCode"
                pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*"
                placeholder="ADE-STUDIO"
                required
              />
              <div className="panel-actions">
                <Link className="button button-secondary" href="/onboarding/locations">
                  Back to locations
                </Link>
                <div className="panel-action-group">
                  <button
                    className="button button-secondary"
                    formAction={skipBrands}
                    formNoValidate
                    type="submit"
                  >
                    Skip for now
                  </button>
                  <button className="button button-primary" type="submit">
                    Save brand and continue
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      )}
    </OnboardingPage>
  );
}
