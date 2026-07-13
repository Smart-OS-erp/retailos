import { redirect } from "next/navigation";

import { IntegrationHub } from "@/components/integration-hub";
import { OnboardingPage } from "@/components/onboarding-page";
import { hasPermission } from "@/lib/auth/authorization";
import { requireUser } from "@/lib/auth/require-user";
import { getOnboardingContext } from "@/lib/navigation/onboarding";

import { confirmDataSourceReadiness } from "../actions";

type DataSourcePageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
    sync?: string;
  }>;
};

export default async function DataSourcePage({
  searchParams,
}: DataSourcePageProps) {
  const [context, params, authContext] = await Promise.all([
    getOnboardingContext(),
    searchParams,
    requireUser(),
  ]);

  if (!context) {
    redirect("/create-organization");
  }

  const organizationId = context.organization.id;
  const [providersResult, sourcesResult, jobsResult, recordsResult] =
    await Promise.all([
      authContext.supabase
        .from("integration_providers")
        .select(
          "id, provider_key, display_name, source_system, default_connector_depth, supports_manual_sync, supports_webhooks, help_text",
        )
        .eq("is_enabled", true)
        .order("display_name", { ascending: true }),
      authContext.supabase
        .from("data_sources")
        .select(
          "id, provider_id, name, source_key, connector_depth, status, credential_status, last_sync_requested_at, last_successful_sync_at, last_error_at, created_at",
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      authContext.supabase
        .from("sync_jobs")
        .select("id, data_source_id, trigger, status, error_summary, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(25),
      authContext.supabase
        .from("external_records")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
    ]);

  if (providersResult.error || sourcesResult.error || jobsResult.error) {
    redirect("/setup-error?error=setup-state");
  }

  const dataSources = sourcesResult.data ?? [];
  const canComplete = dataSources.length > 0;

  return (
    <OnboardingPage
      context={context}
      currentStep="data_source"
      description="Choose the systems behind your inventory and sales activity. RetailOS records the source before any external data is trusted."
      title="Set up your data source"
    >
      {() => (
        <IntegrationHub
          canManage={hasPermission(context.membership.role, "integration.manage")}
          canSync={hasPermission(context.membership.role, "integration.sync")}
          dataSources={dataSources}
          externalRecordCount={recordsResult.count ?? 0}
          footer={(
            <section className="panel" aria-labelledby="data-source-finish-title">
              <h2 id="data-source-finish-title">Finish source setup</h2>
              <p className="muted">
                Complete onboarding after at least one source is saved. Upload,
                Import API, and real connector sync still run through separate
                validation and consolidation workflows.
              </p>
              <form action={confirmDataSourceReadiness} className="stack">
                <input
                  name="organizationId"
                  type="hidden"
                  value={organizationId}
                />
                <input
                  name="dataReadiness"
                  type="hidden"
                  value={canComplete ? "acknowledged" : ""}
                />
                <div className="panel-actions">
                  <span className="muted">Data source 5 of 5</span>
                  <button
                    className="button button-primary"
                    disabled={!canComplete}
                    type="submit"
                  >
                    Complete setup review
                  </button>
                </div>
              </form>
            </section>
          )}
          mode="onboarding"
          organizationId={organizationId}
          providers={providersResult.data ?? []}
          queryState={{
            created: params.created === "1",
            error: params.error,
            sync: params.sync,
          }}
          recentSyncJobs={jobsResult.data ?? []}
          returnPath="/onboarding/data-source"
        />
      )}
    </OnboardingPage>
  );
}
