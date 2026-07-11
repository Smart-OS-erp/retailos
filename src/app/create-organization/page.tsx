import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { getOnboardingContext, nextIncompleteStep } from "@/lib/navigation/onboarding";

import { createOrganization } from "@/app/onboarding/actions";

type CreateOrganizationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CreateOrganizationPage({
  searchParams,
}: CreateOrganizationPageProps) {
  const context = await getOnboardingContext();
  if (context) {
    redirect(nextIncompleteStep(context));
  }

  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : "";

  return (
    <AuthShell>
      <div className="auth-card">
        <header className="auth-card-header">
          <p className="eyebrow">Organization setup</p>
          <h1>Create your secure workspace</h1>
          <p className="lede">
            This creates the organization and your owner membership together in
            one audited database operation.
          </p>
        </header>

        {errorKey ? (
          <Notice title="Organization was not created" tone="error">
            {errorKey === "invalid"
              ? "Check the organization name and URL identifier, then try again."
              : "That URL identifier may be unavailable. Choose another or retry."}
          </Notice>
        ) : null}

        <form action={createOrganization} className="stack">
          <FormField
            autoComplete="organization"
            label="Organization name"
            maxLength={120}
            minLength={2}
            name="organizationName"
            placeholder="Adebayo Fashion Group"
            required
          />
          <FormField
            autoCapitalize="none"
            help="Lowercase letters, numbers, and single hyphens only."
            label="Organization URL identifier"
            maxLength={64}
            minLength={2}
            name="organizationSlug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="adebayo-fashion"
            required
          />
          <button className="button button-primary button-full" type="submit">
            Create secure organization
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
