import type { ReactNode } from "react";

import { FormField } from "@/components/form-field";
import { Notice } from "@/components/notice";
import {
  createIntegrationDataSource,
  requestDataSourceSync,
} from "@/app/integrations/actions";
import type { Database } from "@/types/database";

type Provider = Pick<
  Database["public"]["Tables"]["integration_providers"]["Row"],
  | "default_connector_depth"
  | "display_name"
  | "help_text"
  | "id"
  | "provider_key"
  | "source_system"
  | "supports_manual_sync"
  | "supports_webhooks"
>;

type DataSource = Pick<
  Database["public"]["Tables"]["data_sources"]["Row"],
  | "connector_depth"
  | "credential_status"
  | "created_at"
  | "id"
  | "last_error_at"
  | "last_successful_sync_at"
  | "last_sync_requested_at"
  | "name"
  | "provider_id"
  | "source_key"
  | "status"
>;

type SyncJob = Pick<
  Database["public"]["Tables"]["sync_jobs"]["Row"],
  | "created_at"
  | "data_source_id"
  | "error_summary"
  | "id"
  | "status"
  | "trigger"
>;

type IntegrationHubProps = {
  canManage: boolean;
  canSync: boolean;
  dataSources: DataSource[];
  externalRecordCount: number;
  footer?: ReactNode;
  mode: "full" | "onboarding";
  organizationId: string;
  providers: Provider[];
  queryState?: {
    created?: boolean;
    error?: string | undefined;
    sync?: string | undefined;
  };
  recentSyncJobs: SyncJob[];
  returnPath: "/integrations" | "/onboarding/data-source";
};

const errorMessages: Record<string, string> = {
  authorization: "RetailOS could not verify the active organization for this action.",
  "connector-depth": "That connector depth is not approved for this provider yet.",
  "create-failed": "RetailOS could not safely create the data source.",
  "duplicate-source": "A data source with that provider and name already exists.",
  "invalid-source": "Use a clear source name between 2 and 120 characters.",
  "permission-denied": "Your role cannot manage Integration Hub sources.",
  "sync-failed": "RetailOS could not enqueue the sync request safely.",
  "unsupported-provider": "That provider is not enabled for Phase 0.5.",
};

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function statusTone(value: string) {
  if (["connected", "succeeded", "verified", "processed"].includes(value)) {
    return "status-badge-success";
  }
  if (["error", "failed", "configuration_required"].includes(value)) {
    return "status-badge-error";
  }
  if (["syncing", "queued", "running", "received"].includes(value)) {
    return "status-badge-warning";
  }
  return "";
}

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleString("en-NG") : "Not yet";
}

export function IntegrationHub({
  canManage,
  canSync,
  dataSources,
  externalRecordCount,
  footer,
  mode,
  organizationId,
  providers,
  queryState,
  recentSyncJobs,
  returnPath,
}: IntegrationHubProps) {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const latestJobBySource = new Map<string, SyncJob>();
  for (const job of recentSyncJobs) {
    if (!latestJobBySource.has(job.data_source_id)) {
      latestJobBySource.set(job.data_source_id, job);
    }
  }

  const connectedSources = dataSources.filter(
    (source) => source.status === "connected",
  ).length;
  const sourcesNeedingAttention = dataSources.filter((source) =>
    ["configuration_required", "error"].includes(source.status),
  ).length;

  return (
    <div className="content-grid">
      {queryState?.created ? (
        <Notice title="Data source created" tone="success">
          RetailOS saved the source inside this organization. Credential-backed
          connectors remain scaffolded until secrets and sync depth are reviewed.
        </Notice>
      ) : null}
      {queryState?.sync ? (
        <Notice title="Sync request recorded" tone="info">
          RetailOS enqueued the safe Phase 0.5 sync scaffold. Sources without
          credentials fail closed and record an auditable error.
        </Notice>
      ) : null}
      {queryState?.error ? (
        <Notice title="Integration action needs attention" tone="error">
          {errorMessages[queryState.error] ?? "RetailOS failed closed. Review the source and try again."}
        </Notice>
      ) : null}

      <section className="summary-grid" aria-label="Integration Hub live status">
        <article className="summary-card">
          <span>Data sources</span>
          <strong>{dataSources.length}</strong>
        </article>
        <article className="summary-card">
          <span>Connected sources</span>
          <strong>{connectedSources}</strong>
        </article>
        <article className="summary-card">
          <span>Sources needing attention</span>
          <strong>{sourcesNeedingAttention}</strong>
        </article>
      </section>

      <div className="content-grid content-grid-two">
        <section className="panel" aria-labelledby="integration-setup-title">
          <h2 id="integration-setup-title">
            {mode === "onboarding"
              ? "How do you currently manage inventory and sales?"
              : "Add a data source"}
          </h2>
          <p className="muted">
            RetailOS connects to the system behind the sales channel. A website
            is not treated as the source of truth unless its backend, feed, or
            Import API path is configured.
          </p>

          {canManage ? (
            <form action={createIntegrationDataSource} className="stack">
              <input
                name="organizationId"
                type="hidden"
                value={organizationId}
              />
              <input name="returnPath" type="hidden" value={returnPath} />
              <fieldset className="provider-fieldset">
                <legend className="field-label">Source system</legend>
                <div className="provider-grid">
                  {providers.map((provider) => (
                    <label
                      className="provider-option"
                      htmlFor={`provider-${provider.provider_key}`}
                      key={provider.id}
                    >
                      <input
                        defaultChecked={provider.provider_key === "csv_excel"}
                        id={`provider-${provider.provider_key}`}
                        name="providerKey"
                        required
                        type="radio"
                        value={provider.provider_key}
                      />
                      <span>
                        <strong>{provider.display_name}</strong>
                        <small>{provider.help_text}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <FormField
                help="Example: Lekki Shopify, Wholesale Google Sheet, CSV upload path."
                label="Source name"
                maxLength={120}
                minLength={2}
                name="dataSourceName"
                placeholder="Lekki CSV intake"
                required
              />
              <button className="button button-primary" type="submit">
                Save data source
              </button>
            </form>
          ) : (
            <Notice title="View-only integration access" tone="info">
              Your role can review Integration Hub status but cannot create or
              change sources.
            </Notice>
          )}
        </section>

        <aside className="panel" aria-labelledby="integration-boundary-title">
          <h2 id="integration-boundary-title">Phase 0.5 boundary</h2>
          <dl className="definition">
            <div>
              <dt>External records stored</dt>
              <dd>{externalRecordCount}</dd>
            </div>
            <div>
              <dt>Real connector auth</dt>
              <dd>Not configured</dd>
            </div>
            <div>
              <dt>Import API</dt>
              <dd>Not built yet</dd>
            </div>
            <div>
              <dt>Next safe action</dt>
              <dd>Create source, then review scaffold sync outcome.</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className="panel" aria-labelledby="data-sources-title">
        <div className="data-toolbar">
          <div>
            <h2 id="data-sources-title">Organization data sources</h2>
            <p className="muted">
              These rows are live tenant data protected by Supabase RLS. They do
              not contain provider secrets.
            </p>
          </div>
          <span className="table-meta">
            Latest {dataSources.length} source{dataSources.length === 1 ? "" : "s"}
          </span>
        </div>

        {dataSources.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Credentials</th>
                  <th>Last sync</th>
                  <th>Latest job</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {dataSources.map((source) => {
                  const provider = providerById.get(source.provider_id);
                  const latestJob = latestJobBySource.get(source.id);
                  const canRequestSync = Boolean(
                    canSync && provider?.supports_manual_sync,
                  );

                  return (
                    <tr key={source.id}>
                      <td>
                        <strong>{source.name}</strong>
                        <span className="table-meta">{source.source_key}</span>
                      </td>
                      <td>{provider?.display_name ?? "Unknown provider"}</td>
                      <td>
                        <span className={`status-badge ${statusTone(source.status)}`}>
                          {formatStatus(source.status)}
                        </span>
                      </td>
                      <td>{formatStatus(source.credential_status)}</td>
                      <td>{dateLabel(source.last_sync_requested_at)}</td>
                      <td>
                        {latestJob ? (
                          <>
                            <span className={`status-badge ${statusTone(latestJob.status)}`}>
                              {formatStatus(latestJob.status)}
                            </span>
                            {latestJob.error_summary ? (
                              <span className="table-meta">
                                {latestJob.error_summary}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="table-meta">No sync jobs yet</span>
                        )}
                      </td>
                      <td>
                        {canRequestSync ? (
                          <form action={requestDataSourceSync}>
                            <input
                              name="organizationId"
                              type="hidden"
                              value={organizationId}
                            />
                            <input
                              name="dataSourceId"
                              type="hidden"
                              value={source.id}
                            />
                            <input
                              name="returnPath"
                              type="hidden"
                              value={returnPath}
                            />
                            <button className="button button-secondary" type="submit">
                              Request sync
                            </button>
                          </form>
                        ) : (
                          <span className="table-meta">No manual sync</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">
            No data source exists yet. Add CSV / Excel or a scaffolded provider
            to begin Phase 0.5 setup.
          </p>
        )}
      </section>

      {footer}
    </div>
  );
}
