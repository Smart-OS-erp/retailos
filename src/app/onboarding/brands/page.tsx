import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { OnboardingPage } from "@/components/onboarding-page";
import { requireUser } from "@/lib/auth/require-user";

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
  const { supabase } = await requireUser();
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, code")
    .order("created_at", { ascending: true });

  return (
    <OnboardingPage
      currentStep="brands"
      description="Record a brand identity now, or safely skip this optional step and return later."
      title="Add the brands you operate"
    >
      {(context) => (
        <section className="panel" aria-labelledby="brand-title">
          <h2 id="brand-title">
            {brands?.length ? "Brands recorded" : "First brand"}
          </h2>
          {error ? (
            <Notice title="Brand needs attention" tone="error">
              {error === "invalid"
                ? "Check the brand name and code."
                : "We could not safely save that brand. It may already exist."}
            </Notice>
          ) : null}
          {brands?.length ? (
            <>
              <dl className="definition">
                {brands.map((brand) => (
                  <div key={brand.id}>
                    <dt>{brand.code}</dt>
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
                <span className="muted">Brands 3 of 5</span>
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
            </form>
          )}
        </section>
      )}
    </OnboardingPage>
  );
}
