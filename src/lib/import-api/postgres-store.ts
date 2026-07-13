import "server-only";

import { Pool, type PoolClient } from "pg";

import {
  ImportApiError,
  type ImportApiIngestInput,
  type ImportApiIngestResult,
  type ImportApiRecord,
  type ImportApiStore,
} from "@/lib/import-api/contract";
import { sha256Evidence } from "@/lib/import-api/crypto";
import { getServerEnv } from "@/lib/env/server";

type CredentialRow = {
  credential_id: string;
  organization_id: string;
  data_source_id: string;
};

type IdempotencyRow = {
  request_hash: string;
  status: string;
  sync_job_id: string | null;
  response_summary: ImportApiIngestResult | Record<string, never>;
};

const globalForImportApi = globalThis as typeof globalThis & {
  retailOsImportApiPool?: Pool;
};

function getPool() {
  if (!globalForImportApi.retailOsImportApiPool) {
    const env = getServerEnv();
    globalForImportApi.retailOsImportApiPool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }

  return globalForImportApi.retailOsImportApiPool;
}

async function findCredential(client: PoolClient, tokenHash: string) {
  const result = await client.query<CredentialRow>(
    `
      select
        credential.id as credential_id,
        credential.organization_id,
        credential.data_source_id
      from public.import_api_credentials as credential
      join public.data_sources as source
        on source.organization_id = credential.organization_id
       and source.id = credential.data_source_id
      join public.integration_providers as provider
        on provider.id = source.provider_id
      where credential.token_hash = $1
        and credential.status = 'active'
        and (credential.expires_at is null or credential.expires_at > timezone('utc', now()))
        and source.status not in ('disabled', 'paused')
        and provider.source_system = 'import_api'
      limit 1
    `,
    [tokenHash],
  );

  return result.rows[0] ?? null;
}

async function reserveIdempotencyKey(
  client: PoolClient,
  input: ImportApiIngestInput,
  credential: CredentialRow,
) {
  const result = await client.query<IdempotencyRow>(
    `
      insert into public.import_api_idempotency_keys (
        organization_id,
        data_source_id,
        credential_id,
        idempotency_key,
        request_hash,
        status
      )
      values ($1, $2, $3, $4, $5, 'reserved')
      on conflict (organization_id, data_source_id, idempotency_key)
      do update set last_seen_at = timezone('utc', now())
      returning request_hash, status, sync_job_id, response_summary
    `,
    [
      credential.organization_id,
      credential.data_source_id,
      credential.credential_id,
      input.idempotencyKey,
      input.requestHash,
    ],
  );

  const row = result.rows[0];
  if (!row) throw new ImportApiError("internal_error", 500);

  if (row.request_hash !== input.requestHash) {
    throw new ImportApiError("idempotency_conflict", 409);
  }

  return row;
}

async function createSyncJob(
  client: PoolClient,
  input: ImportApiIngestInput,
  credential: CredentialRow,
) {
  const result = await client.query<{ id: string }>(
    `
      insert into public.sync_jobs (
        organization_id,
        data_source_id,
        trigger,
        status,
        idempotency_key
      )
      values ($1, $2, 'api', 'queued', $3)
      on conflict (organization_id, data_source_id, idempotency_key)
      do update set updated_at = timezone('utc', now())
      returning id
    `,
    [
      credential.organization_id,
      credential.data_source_id,
      input.idempotencyKey,
    ],
  );

  const id = result.rows[0]?.id;
  if (!id) throw new ImportApiError("internal_error", 500);

  return id;
}

async function insertExternalRecord(
  client: PoolClient,
  credential: CredentialRow,
  syncJobId: string,
  record: ImportApiRecord,
) {
  const payloadText = JSON.stringify({
    ...record.payload,
    location_code: record.location_code,
  });

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
      values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'received')
      on conflict (organization_id, data_source_id, record_type, source_record_key)
      do nothing
      returning id
    `,
    [
      credential.organization_id,
      credential.data_source_id,
      syncJobId,
      record.record_type,
      record.source_record_key,
      record.source_updated_at,
      payloadText,
      sha256Evidence(payloadText),
    ],
  );

  return Boolean(result.rows[0]?.id);
}

async function completeIdempotencyKey(
  client: PoolClient,
  input: ImportApiIngestInput,
  credential: CredentialRow,
  result: ImportApiIngestResult,
) {
  await client.query(
    `
      update public.import_api_idempotency_keys
      set
        status = 'completed',
        sync_job_id = $1,
        response_summary = $2::jsonb,
        last_seen_at = timezone('utc', now())
      where organization_id = $3
        and data_source_id = $4
        and idempotency_key = $5
    `,
    [
      result.syncJobId,
      JSON.stringify(result),
      credential.organization_id,
      credential.data_source_id,
      input.idempotencyKey,
    ],
  );
}

export class PostgresImportApiStore implements ImportApiStore {
  async ingest(input: ImportApiIngestInput): Promise<ImportApiIngestResult> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("begin");

      const credential = await findCredential(client, input.tokenHash);
      if (!credential) {
        throw new ImportApiError("authentication_required", 401);
      }

      const idempotency = await reserveIdempotencyKey(client, input, credential);

      if (
        idempotency.status === "completed"
        && idempotency.sync_job_id
        && "syncJobId" in idempotency.response_summary
      ) {
        await client.query("commit");
        return {
          ...(idempotency.response_summary as ImportApiIngestResult),
          idempotentReplay: true,
        };
      }

      const syncJobId = await createSyncJob(client, input, credential);
      let acceptedRecords = 0;

      for (const record of input.records) {
        if (await insertExternalRecord(client, credential, syncJobId, record)) {
          acceptedRecords += 1;
        }
      }

      const result: ImportApiIngestResult = {
        syncJobId,
        acceptedRecords,
        duplicateRecords: input.records.length - acceptedRecords,
        idempotentReplay: false,
      };

      await completeIdempotencyKey(client, input, credential, result);
      await client.query(
        `
          update public.import_api_credentials
          set last_used_at = timezone('utc', now())
          where organization_id = $1
            and id = $2
        `,
        [credential.organization_id, credential.credential_id],
      );
      await client.query(
        `
          update public.data_sources
          set
            last_sync_requested_at = timezone('utc', now()),
            status = 'syncing'
          where organization_id = $1
            and id = $2
        `,
        [credential.organization_id, credential.data_source_id],
      );
      await client.query("commit");

      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
