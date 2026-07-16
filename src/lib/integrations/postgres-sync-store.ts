import "server-only";

import { Pool, type PoolClient } from "pg";

import { getServerEnv } from "@/lib/env/server";
import { sha256Evidence } from "@/lib/import-api/crypto";
import {
  externalRecordStatusForProviderWrite,
  type ProviderSyncError,
  type ShopifyExternalRecord,
  type ShopifySyncEnvelope,
  type ShopifySyncStore,
} from "@/lib/integrations/shopify-worker";

type EnvelopeRow = {
  job_id: string;
  organization_id: string;
  data_source_id: string;
  provider_key: string;
  source_key: string;
  connector_depth: ShopifySyncEnvelope["connectorDepth"];
  data_source_status: ShopifySyncEnvelope["dataSourceStatus"];
  credential_status: ShopifySyncEnvelope["credentialStatus"];
  sync_job_status: ShopifySyncEnvelope["syncJobStatus"];
};

const globalForProviderSync = globalThis as typeof globalThis & {
  retailOsProviderSyncPool?: Pool;
};

function getPool() {
  if (!globalForProviderSync.retailOsProviderSyncPool) {
    const env = getServerEnv();
    globalForProviderSync.retailOsProviderSyncPool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }

  return globalForProviderSync.retailOsProviderSyncPool;
}

export class PostgresProviderSyncStore implements ShopifySyncStore {
  async getEnvelope(jobId: string) {
    const pool = getPool();
    const result = await pool.query<EnvelopeRow>(
      `
        select
          job.id as job_id,
          job.organization_id,
          job.data_source_id,
          provider.provider_key,
          source.source_key,
          source.connector_depth,
          source.status as data_source_status,
          source.credential_status,
          job.status as sync_job_status
        from public.sync_jobs as job
        join public.data_sources as source
          on source.organization_id = job.organization_id
         and source.id = job.data_source_id
        join public.integration_providers as provider
          on provider.id = source.provider_id
        where job.id = $1
        limit 1
      `,
      [jobId],
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      jobId: row.job_id,
      organizationId: row.organization_id,
      dataSourceId: row.data_source_id,
      providerKey: row.provider_key,
      sourceKey: row.source_key,
      connectorDepth: row.connector_depth,
      dataSourceStatus: row.data_source_status,
      credentialStatus: row.credential_status,
      syncJobStatus: row.sync_job_status,
    } satisfies ShopifySyncEnvelope;
  }

  async markRunning(jobId: string) {
    const pool = getPool();
    await pool.query(
      `
        update public.sync_jobs
        set
          status = 'running',
          attempt_count = least(attempt_count + 1, 100),
          started_at = coalesce(started_at, timezone('utc', now())),
          error_summary = null,
          updated_at = timezone('utc', now())
        where id = $1
          and status = 'queued'
      `,
      [jobId],
    );
  }

  async upsertExternalRecords(
    envelope: ShopifySyncEnvelope,
    records: ShopifyExternalRecord[],
  ) {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("begin");
      let persisted = 0;

      for (const record of records) {
        persisted += await upsertExternalRecord(client, envelope, record);
      }

      await client.query("commit");
      return persisted;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async markFailed(
    envelope: Pick<ShopifySyncEnvelope, "jobId" | "organizationId" | "dataSourceId">,
    error: ProviderSyncError,
  ) {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("begin");
      await client.query(
        `
          insert into public.sync_errors (
            organization_id,
            sync_job_id,
            severity,
            error_code,
            message,
            retryable
          )
          values ($1, $2, 'error', $3, $4, $5)
        `,
        [
          envelope.organizationId,
          envelope.jobId,
          error.code,
          error.message,
          error.retryable,
        ],
      );
      await client.query(
        `
          update public.sync_jobs
          set
            status = 'failed',
            finished_at = timezone('utc', now()),
            error_summary = $1,
            updated_at = timezone('utc', now())
          where organization_id = $2
            and id = $3
        `,
        [
          error.message.slice(0, 500),
          envelope.organizationId,
          envelope.jobId,
        ],
      );
      await client.query(
        `
          update public.data_sources
          set
            status = 'error',
            last_error_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
          where organization_id = $1
            and id = $2
        `,
        [envelope.organizationId, envelope.dataSourceId],
      );
      await client.query("commit");
    } catch (failure) {
      await client.query("rollback");
      throw failure;
    } finally {
      client.release();
    }
  }
}

async function upsertExternalRecord(
  client: PoolClient,
  envelope: ShopifySyncEnvelope,
  record: ShopifyExternalRecord,
) {
  const payloadText = JSON.stringify(record.payload);
  const result = await client.query<{ id: string }>(
    `
      insert into public.external_records (
        organization_id,
        data_source_id,
        sync_job_id,
        record_type,
        source_record_key,
        source_updated_at,
        payload,
        payload_hash,
        status
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      on conflict (organization_id, data_source_id, record_type, source_record_key)
      do update set
        sync_job_id = excluded.sync_job_id,
        source_updated_at = excluded.source_updated_at,
        payload = excluded.payload,
        payload_hash = excluded.payload_hash,
        status = excluded.status,
        normalized_at = null
      returning id
    `,
    [
      envelope.organizationId,
      envelope.dataSourceId,
      envelope.jobId,
      record.recordType,
      record.sourceRecordKey,
      record.sourceUpdatedAt,
      payloadText,
      sha256Evidence(payloadText),
      externalRecordStatusForProviderWrite(),
    ],
  );

  return result.rows[0]?.id ? 1 : 0;
}
