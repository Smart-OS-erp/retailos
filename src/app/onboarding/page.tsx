import { signOut } from "@/app/login/actions";
import { requireUser } from "@/lib/auth/require-user";

import { createOrganization } from "./actions";

type OnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const { data: organization } = membership
    ? await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", membership.organization_id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="shell">
      <section className="card" aria-labelledby="onboarding-title">
        <p className="eyebrow">Phase 0 onboarding</p>
        <h1 id="onboarding-title">
          {organization ? "Organization foundation ready" : "Create your organization"}
        </h1>

        {organization && membership ? (
          <>
            <p className="lede">
              Your authenticated identity is linked to a tenant-scoped
              membership. No dashboard or inventory feature is included yet.
            </p>
            <dl className="definition">
              <div>
                <dt>Organization</dt>
                <dd>{organization.name}</dd>
              </div>
              <div>
                <dt>Organization slug</dt>
                <dd>{organization.slug}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{membership.role}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <p className="lede">
              This atomic step creates the organization, your owner membership,
              and an audit event. Database policies deny cross-tenant access.
            </p>

            {params.error ? (
              <p className="notice notice-error" role="alert">
                {params.error === "invalid"
                  ? "Enter a valid organization name and slug."
                  : "The organization could not be created. Check the slug or try again."}
              </p>
            ) : null}

            <form action={createOrganization} className="stack">
              <label>
                Organization name
                <input
                  autoComplete="organization"
                  maxLength={120}
                  minLength={2}
                  name="organizationName"
                  required
                />
              </label>
              <label>
                Organization slug
                <input
                  aria-describedby="slug-help"
                  autoCapitalize="none"
                  maxLength={64}
                  minLength={2}
                  name="organizationSlug"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="example-fashion-group"
                  required
                />
              </label>
              <p className="help" id="slug-help">
                Use lowercase letters, numbers, and single hyphens.
              </p>
              <button className="primary" type="submit">
                Create secure organization
              </button>
            </form>
          </>
        )}

        <form action={signOut} className="stack">
          <button className="secondary" type="submit">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
