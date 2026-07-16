import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { IntegrationHub } from "@/components/integration-hub";
import { hasPermission } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";

type IntegrationsPageProps = {
  searchParams: Promise<{
    credential?: string;
    created?: string;
    error?: string;
    sync?: string;
  }>;
};

export default async function IntegrationsPage({
  searchParams,
}: IntegrationsPageProps) {
  const [context, params] = await Promise.all([
    requireOrganizationContext(),
    searchParams,
  ]);

  if (!hasPermission(context.membership.role, "integration.view")) {
    redirect("/workspace?error=permission-denied");
  }

  const organizationId = context.membership.organization_id;
  const [providersResult, sourcesResult, jobsResult, recordsResult] =
    await Promise.all([
      context.supabase
        .from("integration_providers")
        .select(
          "id, provider_key, display_name, source_system, default_connector_depth, supports_manual_sync, supports_webhooks, help_text",
        )
        .eq("is_enabled", true)
        .order("display_name", { ascending: true }),
      context.supabase
        .from("data_sources")
        .select(
          "id, provider_id, name, source_key, connector_depth, status, credential_status, last_sync_requested_at, last_successful_sync_at, last_error_at, created_at",
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("sync_jobs")
        .select("id, data_source_id, trigger, status, error_summary, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(25),
      context.supabase
        .from("external_records")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
    ]);

  if (providersResult.error || sourcesResult.error || jobsResult.error) {
    redirect("/setup-error?error=setup-state");
  }

  return (
    <AppShell
      email={context.user.email ?? "Signed-in user"}
      organizationName={context.organization.name}
      role={context.membership.role}
    >
      <header className="page-header">
        <p className="eyebrow">Integration Hub</p>
        <h1>Connected retail data sources</h1>
        <p className="lede">
          Configure the systems behind store, ecommerce, spreadsheet, and import
          feeds without trusting external data before validation.
        </p>
      </header>
      <IntegrationHub
        canManage={hasPermission(context.membership.role, "integration.manage")}
        canSync={hasPermission(context.membership.role, "integration.sync")}
        dataSources={sourcesResult.data ?? []}
        externalRecordCount={recordsResult.count ?? 0}
        mode="full"
        organizationId={organizationId}
        providers={providersResult.data ?? []}
        queryState={{
          credential: params.credential,
          created: params.created === "1",
          error: params.error,
          sync: params.sync,
        }}
        recentSyncJobs={jobsResult.data ?? []}
        returnPath="/integrations"
      />
    </AppShell>
  );
}
