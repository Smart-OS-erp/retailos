import "server-only";

import { Pool, type PoolClient } from "pg";

import { getServerEnv } from "@/lib/env/server";
import { runProviderSyncAfterEnqueue } from "@/lib/integrations/provider-sync";

type NormalizeResult = {
  error: {
    code?: string;
    message?: string;
  } | null;
};

export type ScheduledSyncCandidate = {
  dataSourceId: string;
  intervalMinutes: number;
  nextRunAt: string;
  organizationId: string;
  providerKey: string;
  runAsUserId: string;
  scheduleId: string;
};

export type ScheduledSyncStore = {
  claimDueSchedules(
    input: Readonly<{ limit: number; now: Date }>,
  ): Promise<ScheduledSyncCandidate[]>;
  enqueueScheduledSync(
    candidate: ScheduledSyncCandidate,
    idempotencyKey: string,
  ): Promise<{ jobId: string; reused: boolean }>;
  normalizeExternalRecords(
    jobId: string,
    candidate: ScheduledSyncCandidate,
  ): Promise<NormalizeResult>;
  markScheduleComplete(
    candidate: ScheduledSyncCandidate,
    jobId: string,
    now: Date,
  ): Promise<void>;
  markScheduleFailed(
    candidate: ScheduledSyncCandidate,
    error: Error,
    now: Date,
  ): Promise<void>;
};

export type ScheduledSyncRunResult = {
  claimed: number;
  enqueued: number;
  failed: number;
  normalized: number;
  reused: number;
};

const DEFAULT_LIMIT = 10;
const SCHEDULE_LOCK_MINUTES = 10;
const supportedScheduledProviders = new Set(["shopify", "woocommerce"]);

const globalForScheduledSync = globalThis as typeof globalThis & {
  retailOsScheduledSyncPool?: Pool;
};

function getPool() {
  if (!globalForScheduledSync.retailOsScheduledSyncPool) {
    const env = getServerEnv();
    globalForScheduledSync.retailOsScheduledSyncPool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
    });
  }

  return globalForScheduledSync.retailOsScheduledSyncPool;
}

export async function runScheduledIntegrationSync(
  input?: Readonly<{ limit?: number; now?: Date }>,
  dependencies?: Readonly<{
    providerSync?: typeof runProviderSyncAfterEnqueue;
    store?: ScheduledSyncStore;
  }>,
): Promise<ScheduledSyncRunResult> {
  const now = input?.now ?? new Date();
  const limit = Math.max(1, Math.min(input?.limit ?? DEFAULT_LIMIT, 25));
  const store = dependencies?.store ?? new PostgresScheduledSyncStore();
  const providerSync = dependencies?.providerSync ?? runProviderSyncAfterEnqueue;
  const candidates = await store.claimDueSchedules({ limit, now });
  const result: ScheduledSyncRunResult = {
    claimed: candidates.length,
    enqueued: 0,
    failed: 0,
    normalized: 0,
    reused: 0,
  };

  for (const candidate of candidates) {
    if (!supportedScheduledProviders.has(candidate.providerKey)) {
      await store.markScheduleFailed(
        candidate,
        new Error(`Unsupported scheduled provider: ${candidate.providerKey}`),
        now,
      );
      result.failed += 1;
      continue;
    }

    try {
      const enqueue = await store.enqueueScheduledSync(
        candidate,
        scheduledIdempotencyKey(candidate),
      );
      result.enqueued += enqueue.reused ? 0 : 1;
      result.reused += enqueue.reused ? 1 : 0;

      const sync = await providerSync({
        jobId: enqueue.jobId,
        organizationId: candidate.organizationId,
        normalizeExternalRecords: (jobId) =>
          store.normalizeExternalRecords(jobId, candidate),
      });

      if (sync.status === "normalized") {
        result.normalized += 1;
      }

      await store.markScheduleComplete(candidate, enqueue.jobId, now);
    } catch (error) {
      await store.markScheduleFailed(candidate, toError(error), now);
      result.failed += 1;
    }
  }

  return result;
}

export function scheduledIdempotencyKey(candidate: ScheduledSyncCandidate) {
  const bucket = candidate.nextRunAt
    .replace(/\.\d{3}Z$/, "Z")
    .replace(/[^0-9TZ]/g, "");
  return `scheduled-${candidate.scheduleId}-${bucket}`.slice(0, 160);
}

export class PostgresScheduledSyncStore implements ScheduledSyncStore {
  async claimDueSchedules(input: Readonly<{ limit: number; now: Date }>) {
    const pool = getPool();
    const result = await pool.query<{
      data_source_id: string;
      interval_minutes: number;
      next_run_at: string;
      organization_id: string;
      provider_key: string;
      run_as_user_id: string;
      schedule_id: string;
    }>(
      `
        with due as (
          select
            schedule.id as schedule_id,
            schedule.organization_id,
            schedule.data_source_id,
            schedule.interval_minutes,
            schedule.next_run_at,
            schedule.run_as_user_id,
            provider.provider_key
          from public.data_source_sync_schedules as schedule
          join public.data_sources as source
            on source.organization_id = schedule.organization_id
           and source.id = schedule.data_source_id
          join public.integration_providers as provider
            on provider.id = source.provider_id
          where schedule.status = 'enabled'
            and schedule.next_run_at <= $1
            and (
              schedule.locked_until is null
              or schedule.locked_until < $1
            )
            and source.status = 'connected'
            and source.connector_depth = 'mvp'
            and source.credential_status in ('configured', 'not_required')
            and provider.provider_key in ('shopify', 'woocommerce')
          order by schedule.next_run_at asc, schedule.created_at asc
          limit $2
          for update of schedule skip locked
        )
        update public.data_source_sync_schedules as schedule
        set
          locked_until = $1 + ($3::text || ' minutes')::interval,
          updated_at = timezone('utc', now())
        from due
        where schedule.id = due.schedule_id
        returning
          due.schedule_id,
          due.organization_id,
          due.data_source_id,
          due.interval_minutes,
          due.next_run_at,
          due.run_as_user_id,
          due.provider_key
      `,
      [input.now.toISOString(), input.limit, SCHEDULE_LOCK_MINUTES],
    );

    return result.rows.map((row) => ({
      dataSourceId: row.data_source_id,
      intervalMinutes: row.interval_minutes,
      nextRunAt: new Date(row.next_run_at).toISOString(),
      organizationId: row.organization_id,
      providerKey: row.provider_key,
      runAsUserId: row.run_as_user_id,
      scheduleId: row.schedule_id,
    }));
  }

  async enqueueScheduledSync(
    candidate: ScheduledSyncCandidate,
    idempotencyKey: string,
  ) {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("begin");
      const created = await client.query<{ id: string }>(
        `
          insert into public.sync_jobs (
            organization_id,
            data_source_id,
            trigger,
            status,
            idempotency_key,
            requested_by
          )
          values ($1, $2, 'scheduled', 'queued', $3, $4)
          on conflict (organization_id, data_source_id, idempotency_key)
          do nothing
          returning id
        `,
        [
          candidate.organizationId,
          candidate.dataSourceId,
          idempotencyKey,
          candidate.runAsUserId,
        ],
      );

      const jobId = created.rows[0]?.id
        ?? (await client.query<{ id: string }>(
          `
            select id
            from public.sync_jobs
            where organization_id = $1
              and data_source_id = $2
              and idempotency_key = $3
            limit 1
          `,
          [candidate.organizationId, candidate.dataSourceId, idempotencyKey],
        )).rows[0]?.id;

      if (!jobId) {
        throw new Error("Scheduled sync idempotency lookup failed.");
      }

      await client.query(
        `
          update public.data_sources
          set
            status = 'syncing',
            last_sync_requested_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
          where organization_id = $1
            and id = $2
        `,
        [candidate.organizationId, candidate.dataSourceId],
      );
      await client.query(
        `
          update public.data_source_sync_schedules
          set
            last_enqueued_at = timezone('utc', now()),
            last_sync_job_id = $1,
            updated_at = timezone('utc', now())
          where organization_id = $2
            and id = $3
        `,
        [jobId, candidate.organizationId, candidate.scheduleId],
      );
      await client.query("commit");

      return {
        jobId,
        reused: created.rows.length === 0,
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async normalizeExternalRecords(
    jobId: string,
    candidate: ScheduledSyncCandidate,
  ) {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("begin");
      await setScheduledActor(client, candidate.runAsUserId);
      await client.query("select public.normalize_external_records($1)", [jobId]);
      await client.query("commit");
      return { error: null };
    } catch (error) {
      await client.query("rollback");
      return {
        error: {
          code: error instanceof Error ? error.name : "normalization_error",
          message: error instanceof Error
            ? error.message
            : "Scheduled normalization failed.",
        },
      };
    } finally {
      client.release();
    }
  }

  async markScheduleComplete(
    candidate: ScheduledSyncCandidate,
    jobId: string,
    now: Date,
  ) {
    const pool = getPool();
    await pool.query(
      `
        update public.data_source_sync_schedules
        set
          locked_until = null,
          last_sync_job_id = $1,
          failure_count = 0,
          next_run_at = greatest($2::timestamptz, next_run_at)
            + (interval_minutes::text || ' minutes')::interval,
          updated_at = timezone('utc', now())
        where organization_id = $3
          and id = $4
      `,
      [jobId, now.toISOString(), candidate.organizationId, candidate.scheduleId],
    );
  }

  async markScheduleFailed(
    candidate: ScheduledSyncCandidate,
    _error: Error,
    now: Date,
  ) {
    const pool = getPool();
    await pool.query(
      `
        update public.data_source_sync_schedules
        set
          locked_until = null,
          failure_count = least(failure_count + 1, 1000),
          next_run_at = $1::timestamptz
            + (least(interval_minutes, 60)::text || ' minutes')::interval,
          updated_at = timezone('utc', now())
        where organization_id = $2
          and id = $3
      `,
      [now.toISOString(), candidate.organizationId, candidate.scheduleId],
    );
  }
}

async function setScheduledActor(client: PoolClient, userId: string) {
  await client.query(
    "select set_config('request.jwt.claim.sub', $1, true)",
    [userId],
  );
  await client.query(
    "select set_config('request.jwt.claim.role', 'authenticated', true)",
  );
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("Scheduled sync failed.");
}
