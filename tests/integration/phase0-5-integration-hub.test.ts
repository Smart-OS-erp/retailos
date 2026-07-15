import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER_A = "20000000-0000-4000-8000-00000000001a";
const OWNER_B = "20000000-0000-4000-8000-00000000001b";
const MERCH_A = "20000000-0000-4000-8000-00000000001c";
const EXEC_A = "20000000-0000-4000-8000-00000000001d";
const VIEWER_A = "20000000-0000-4000-8000-00000000001e";

describe("Phase 0.5 Integration Hub foundation", () => {
  const database = new PGlite();
  let organizationA: string;
  let organizationB: string;
  let locationB: string;
  let shopifySourceA: string;
  let importApiSourceB: string;
  let importApiCredentialB: string;

  async function authenticate(userId: string) {
    await database.exec("reset role");
    await database.query(
      "select set_config('request.jwt.claim.sub', $1, false)",
      [userId],
    );
    await database.query(
      "select set_config('request.jwt.claim.role', 'authenticated', false)",
    );
    await database.exec("set role authenticated");
  }

  beforeAll(async () => {
    await database.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create schema extensions;
      create table auth.users (id uuid primary key);

      create function auth.uid()
      returns uuid
      language sql
      stable
      as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;

      create function auth.role()
      returns text
      language sql
      stable
      as $$
        select nullif(current_setting('request.jwt.claim.role', true), '');
      $$;

      insert into auth.users (id) values
        ('${OWNER_A}'),
        ('${OWNER_B}'),
        ('${MERCH_A}'),
        ('${EXEC_A}'),
        ('${VIEWER_A}');
    `);

    const migrationsDirectory = path.join(process.cwd(), "supabase", "migrations");
    const migrationNames = (await readdir(migrationsDirectory))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    for (const migrationName of migrationNames) {
      const migration = (
        await readFile(path.join(migrationsDirectory, migrationName), "utf8")
      ).replace(
        "create extension if not exists pgcrypto with schema extensions;",
        "-- gen_random_uuid() is built into the PGlite PostgreSQL test engine.",
      );
      await database.exec(migration);
    }

    await authenticate(OWNER_A);
    organizationA = (
      await database.query<{ id: string }>(
        "select public.create_organization($1, $2) as id",
        ["Integration Tenant A", "integration-tenant-a"],
      )
    ).rows[0]!.id;

    await authenticate(OWNER_B);
    organizationB = (
      await database.query<{ id: string }>(
        "select public.create_organization($1, $2) as id",
        ["Integration Tenant B", "integration-tenant-b"],
      )
    ).rows[0]!.id;
    locationB = (
      await database.query<{ id: string }>(
        `insert into public.locations (
          organization_id, name, code, timezone, created_by
        ) values ($1, 'Tenant B Lagos', 'lagos-import', 'Africa/Lagos', $2)
        returning id`,
        [organizationB, OWNER_B],
      )
    ).rows[0]!.id;

    await database.exec("reset role");
    await database.query(
      `insert into public.memberships (
        organization_id, user_id, role, status, created_by
      ) values
        ($1, $2, 'merchandising_manager', 'active', $5),
        ($1, $3, 'executive', 'active', $5),
        ($1, $4, 'viewer', 'active', $5)`,
      [organizationA, MERCH_A, EXEC_A, VIEWER_A, OWNER_A],
    );

    await authenticate(MERCH_A);
    shopifySourceA = (
      await database.query<{ id: string }>(
        "select public.create_data_source($1, $2, $3) as id",
        [organizationA, "shopify", "Lagos Shopify"],
      )
    ).rows[0]!.id;

    await authenticate(OWNER_B);
    importApiSourceB = (
      await database.query<{ id: string }>(
        "select public.create_data_source($1, $2, $3) as id",
        [organizationB, "import_api", "Tenant B API"],
      )
    ).rows[0]!.id;

    importApiCredentialB = (
      await database.query<{ id: string }>(
        "select public.create_import_api_credential($1, $2, $3, $4) as id",
        [
          importApiSourceB,
          "Tenant B primary import token",
          "rtos_testb123",
          "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        ],
      )
    ).rows[0]!.id;
  }, 30_000);

  afterAll(async () => {
    await database.close();
  });

  it("seeds provider catalogue without exposing tenant data to anonymous users", async () => {
    await authenticate(OWNER_A);
    const providers = await database.query<{
      provider_key: string;
      default_connector_depth: string;
    }>(
      "select provider_key, default_connector_depth from public.integration_providers order by provider_key",
    );

    expect(providers.rows).toEqual([
      { provider_key: "csv_excel", default_connector_depth: "manual" },
      { provider_key: "custom_backend", default_connector_depth: "scaffold" },
      { provider_key: "google_sheets", default_connector_depth: "scaffold" },
      { provider_key: "import_api", default_connector_depth: "api" },
      { provider_key: "pos_erp", default_connector_depth: "scaffold" },
      { provider_key: "shopify", default_connector_depth: "scaffold" },
      { provider_key: "woocommerce", default_connector_depth: "scaffold" },
    ]);

    await database.exec("reset role");
    await database.exec("set role anon");
    await expect(
      database.query("select provider_key from public.integration_providers"),
    ).rejects.toThrow();
  });

  it("creates scaffolded data sources with audit evidence and tenant isolation", async () => {
    await authenticate(MERCH_A);
    const source = await database.query<{
      id: string;
      status: string;
      credential_status: string;
      connector_depth: string;
    }>(
      "select id, status, credential_status, connector_depth from public.data_sources",
    );
    expect(source.rows).toEqual([
      {
        id: shopifySourceA,
        status: "configuration_required",
        credential_status: "missing",
        connector_depth: "scaffold",
      },
    ]);

    await authenticate(OWNER_A);
    const audits = await database.query<{ action: string }>(
      "select action from public.audit_events where target_id = $1 order by created_at",
      [shopifySourceA],
    );
    expect(audits.rows).toContainEqual({ action: "integration.data_sources.insert" });

    await authenticate(OWNER_B);
    const tenantBVisible = await database.query<{ id: string }>(
      "select id from public.data_sources order by id",
    );
    expect(tenantBVisible.rows).toEqual([{ id: importApiSourceB }]);
  });

  it("keeps integration mutation permissions narrower than integration visibility", async () => {
    await authenticate(EXEC_A);
    const visibleSources = await database.query<{ id: string }>(
      "select id from public.data_sources",
    );
    expect(visibleSources.rows).toEqual([{ id: shopifySourceA }]);

    await expect(
      database.query(
        "select public.create_data_source($1, $2, $3)",
        [organizationA, "woocommerce", "Executive Woo"],
      ),
    ).rejects.toThrow(/permission_denied/);

    await authenticate(VIEWER_A);
    const viewerSources = await database.query<{ id: string }>(
      "select id from public.data_sources",
    );
    expect(viewerSources.rows).toEqual([]);
  });

  it("fails scaffold sync safely when credentials are missing and deduplicates retries", async () => {
    await authenticate(MERCH_A);
    const firstJob = (
      await database.query<{ id: string }>(
        "select public.enqueue_data_source_sync($1, $2) as id",
        [shopifySourceA, "manual-sync-001"],
      )
    ).rows[0]!.id;
    const secondJob = (
      await database.query<{ id: string }>(
        "select public.enqueue_data_source_sync($1, $2) as id",
        [shopifySourceA, "manual-sync-001"],
      )
    ).rows[0]!.id;

    const jobs = await database.query<{
      id: string;
      status: string;
      error_summary: string;
    }>(
      "select id, status, error_summary from public.sync_jobs where data_source_id = $1",
      [shopifySourceA],
    );
    const errors = await database.query<{ error_code: string; retryable: boolean }>(
      "select error_code, retryable from public.sync_errors where sync_job_id = $1",
      [firstJob],
    );

    expect(secondJob).toBe(firstJob);
    expect(jobs.rows).toEqual([
      {
        id: firstJob,
        status: "failed",
        error_summary: "Connector credentials are not configured.",
      },
    ]);
    expect(errors.rows).toEqual([
      { error_code: "credentials.missing", retryable: false },
    ]);
  });

  it("stores import API credential metadata without exposing token hashes", async () => {
    await authenticate(OWNER_B);
    const credentials = await database.query<{
      id: string;
      token_prefix: string;
      status: string;
    }>(
      "select id, token_prefix, status from public.import_api_credentials",
    );
    const source = await database.query<{
      status: string;
      credential_status: string;
    }>(
      "select status, credential_status from public.data_sources where id = $1",
      [importApiSourceB],
    );
    const audits = await database.query<{ action: string }>(
      "select action from public.audit_events where target_id = $1",
      [importApiCredentialB],
    );

    expect(credentials.rows).toEqual([
      {
        id: importApiCredentialB,
        token_prefix: "rtos_testb123",
        status: "active",
      },
    ]);
    expect(source.rows).toEqual([
      { status: "connected", credential_status: "configured" },
    ]);
    expect(audits.rows).toContainEqual({
      action: "integration.import_api_credentials.insert",
    });

    await expect(
      database.query("select token_hash from public.import_api_credentials"),
    ).rejects.toThrow();
  });

  it("only allows Import API credentials on Import API data sources", async () => {
    await authenticate(MERCH_A);

    await expect(
      database.query(
        "select public.create_import_api_credential($1, $2, $3, $4)",
        [
          shopifySourceA,
          "Wrong source token",
          "rtos_wrong1",
          "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        ],
      ),
    ).rejects.toThrow(/import_api_source_required/);

    await authenticate(VIEWER_A);
    await expect(
      database.query(
        "select public.create_import_api_credential($1, $2, $3, $4)",
        [
          shopifySourceA,
          "Viewer token",
          "rtos_viewer1",
          "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        ],
      ),
    ).rejects.toThrow();
  });

  it("records Import API idempotency and rate-limit evidence with tenant lineage", async () => {
    await authenticate(OWNER_B);
    const idempotency = await database.query<{ id: string }>(
      `insert into public.import_api_idempotency_keys (
        organization_id, data_source_id, credential_id, idempotency_key,
        request_hash, status
      ) values (
        $1, $2, $3, 'import-request-001',
        'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        'reserved'
      ) returning id`,
      [organizationB, importApiSourceB, importApiCredentialB],
    );
    const rateLimit = await database.query<{ id: string }>(
      `insert into public.import_api_rate_limit_events (
        organization_id, data_source_id, credential_id, limit_name,
        window_started_at, window_seconds, request_count, blocked_count
      ) values (
        $1, $2, $3, 'per_minute',
        timezone('utc', now()), 60, 3, 1
      ) returning id`,
      [organizationB, importApiSourceB, importApiCredentialB],
    );

    expect(idempotency.rows).toHaveLength(1);
    expect(rateLimit.rows).toHaveLength(1);

    await expect(
      database.query(
        `insert into public.import_api_idempotency_keys (
          organization_id, data_source_id, credential_id, idempotency_key,
          request_hash
        ) values (
          $1, $2, $3, 'import-request-001',
          'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
        )`,
        [organizationB, importApiSourceB, importApiCredentialB],
      ),
    ).rejects.toThrow();

    await authenticate(MERCH_A);
    await expect(
      database.query(
        `insert into public.import_api_idempotency_keys (
          organization_id, data_source_id, credential_id, idempotency_key,
          request_hash
        ) values (
          $1, $2, $3, 'cross-tenant-request',
          'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
        )`,
        [organizationA, shopifySourceA, importApiCredentialB],
      ),
    ).rejects.toThrow();
  });

  it("revokes import API credentials without deleting audit evidence", async () => {
    await authenticate(OWNER_B);
    const temporaryCredential = (
      await database.query<{ id: string }>(
        "select public.create_import_api_credential($1, $2, $3, $4) as id",
        [
          importApiSourceB,
          "Temporary import token",
          "rtos_temp123",
          "sha256:1111111111111111111111111111111111111111111111111111111111111111",
        ],
      )
    ).rows[0]!.id;

    await database.query("select public.revoke_import_api_credential($1)", [
      temporaryCredential,
    ]);

    const credential = await database.query<{
      status: string;
      revoked_by: string;
    }>(
      "select status, revoked_by from public.import_api_credentials where id = $1",
      [temporaryCredential],
    );
    const audit = await database.query<{ action: string }>(
      "select action from public.audit_events where target_id = $1 order by created_at",
      [temporaryCredential],
    );

    expect(credential.rows).toEqual([
      { status: "revoked", revoked_by: OWNER_B },
    ]);
    expect(audit.rows).toContainEqual({
      action: "integration.import_api_credentials.update",
    });
  });

  it("queues sync for credentialed import API sources without normalizing records directly", async () => {
    await authenticate(OWNER_B);
    const jobId = (
      await database.query<{ id: string }>(
        "select public.enqueue_data_source_sync($1, $2) as id",
        [importApiSourceB, "tenant-b-api-sync"],
      )
    ).rows[0]!.id;

    const job = await database.query<{ status: string }>(
      "select status from public.sync_jobs where id = $1",
      [jobId],
    );
    const source = await database.query<{ status: string }>(
      "select status from public.data_sources where id = $1",
      [importApiSourceB],
    );

    expect(job.rows).toEqual([{ status: "queued" }]);
    expect(source.rows).toEqual([{ status: "syncing" }]);
  });

  it("normalizes external records into upload staging without canonical writes", async () => {
    await authenticate(OWNER_B);
    const jobId = (
      await database.query<{ id: string }>(
        "select public.enqueue_data_source_sync($1, $2) as id",
        [importApiSourceB, "tenant-b-normalization"],
      )
    ).rows[0]!.id;

    await database.query(
      `insert into public.external_records (
        organization_id, data_source_id, sync_job_id, record_type,
        source_record_key, payload, payload_hash, received_by
      ) values
        (
          $1, $2, $3, 'inventory_snapshot', 'sku-normalized',
          '{"sku":"SKU-NORMALIZED","name":"Normalized jacket","location_code":"lagos-import","on_hand_quantity":7,"approved_unit_cost":12000,"currency_code":"NGN","first_available_at":"2026-07-01","units_sold_90":2,"units_sold_30":1}',
          'hash:normalized-v001', $4
        ),
        (
          $1, $2, $3, 'product_master', 'product-blocked',
          '{"sku":"PRODUCT-BLOCKED","name":"Blocked product"}',
          'hash:blocked-v001', $4
        )`,
      [organizationB, importApiSourceB, jobId, OWNER_B],
    );

    const uploadId = (
      await database.query<{ id: string }>(
        "select public.normalize_external_records($1) as id",
        [jobId],
      )
    ).rows[0]!.id;
    const retryUploadId = (
      await database.query<{ id: string }>(
        "select public.normalize_external_records($1) as id",
        [jobId],
      )
    ).rows[0]!.id;

    const upload = await database.query<{
      row_count: number;
      status: string;
      upload_type: string;
    }>(
      "select upload_type, row_count, status from public.data_uploads where id = $1",
      [uploadId],
    );
    const staging = await database.query<{
      location_id: string | null;
      on_hand_quantity: number | null;
      sku_code: string | null;
      validation_status: string;
    }>(
      `select sku_code, location_id, on_hand_quantity, validation_status
       from public.staging_inventory_rows
       where upload_id = $1
       order by sku_code`,
      [uploadId],
    );
    const issues = await database.query<{
      issue_code: string;
      severity: string;
    }>(
      "select issue_code, severity from public.validation_issues where upload_id = $1 order by issue_code",
      [uploadId],
    );
    const records = await database.query<{
      source_record_key: string;
      status: string;
    }>(
      `select source_record_key, status
       from public.external_records
       where sync_job_id = $1
       order by source_record_key`,
      [jobId],
    );
    const job = await database.query<{
      error_summary: string | null;
      status: string;
    }>(
      "select status, error_summary from public.sync_jobs where id = $1",
      [jobId],
    );
    const run = await database.query<{
      normalized_count: number;
      validation_blocked_count: number;
    }>(
      `select normalized_count, validation_blocked_count
       from public.external_record_normalization_runs
       where sync_job_id = $1`,
      [jobId],
    );
    const snapshots = await database.query<{ count: number }>(
      "select count(*)::integer as count from public.inventory_snapshots where organization_id = $1",
      [organizationB],
    );

    expect(retryUploadId).toBe(uploadId);
    expect(upload.rows).toEqual([
      { upload_type: "inventory_csv", row_count: 2, status: "validation_blocked" },
    ]);
    expect(staging.rows).toEqual([
      {
        sku_code: "PRODUCT-BLOCKED",
        location_id: null,
        on_hand_quantity: null,
        validation_status: "blocked",
      },
      {
        sku_code: "SKU-NORMALIZED",
        location_id: locationB,
        on_hand_quantity: 7,
        validation_status: "valid",
      },
    ]);
    expect(issues.rows).toContainEqual({
      issue_code: "unsupported_external_record_type",
      severity: "blocking",
    });
    expect(records.rows).toEqual([
      { source_record_key: "product-blocked", status: "validation_blocked" },
      { source_record_key: "sku-normalized", status: "normalized" },
    ]);
    expect(job.rows).toEqual([
      {
        status: "partially_succeeded",
        error_summary: "External records normalized with validation blockers.",
      },
    ]);
    expect(run.rows).toEqual([
      { normalized_count: 1, validation_blocked_count: 1 },
    ]);
    expect(snapshots.rows).toEqual([{ count: 0 }]);

    await expect(
      database.query(
        "select public.consolidate_inventory_upload($1, $2)",
        [uploadId, "a".repeat(64)],
      ),
    ).rejects.toThrow(/upload_not_ready|source_changed/);

    await authenticate(MERCH_A);
    await expect(
      database.query("select public.normalize_external_records($1)", [jobId]),
    ).rejects.toThrow(/permission_denied/);
  });

  it("stores external records with tenant lineage and denies cross-tenant lineage", async () => {
    await authenticate(MERCH_A);
    const record = await database.query<{ id: string }>(
      `insert into public.external_records (
        organization_id, data_source_id, record_type, source_record_key,
        payload, payload_hash, received_by
      ) values (
        $1, $2, 'inventory.snapshot', 'sku-001',
        '{"sku":"SKU-001","qty":4}', 'hash:sku-001-v001', $3
      ) returning id`,
      [organizationA, shopifySourceA, MERCH_A],
    );

    expect(record.rows).toHaveLength(1);

    await expect(
      database.query(
        `insert into public.external_records (
          organization_id, data_source_id, record_type, source_record_key,
          payload, payload_hash, received_by
        ) values (
          $1, $2, 'inventory.snapshot', 'cross-tenant',
          '{}', 'hash:cross-tenant-v001', $3
        )`,
        [organizationA, importApiSourceB, MERCH_A],
      ),
    ).rejects.toThrow();
  });

  it("rejects unverified webhooks and accepts only verified tenant-scoped events", async () => {
    await authenticate(MERCH_A);

    await expect(
      database.query(
        `insert into public.webhook_events (
          organization_id, data_source_id, provider_event_id, event_type,
          signature_verified, payload
        ) values ($1, $2, 'evt-unverified', 'products.updated', false, '{}')`,
        [organizationA, shopifySourceA],
      ),
    ).rejects.toThrow();

    const event = await database.query<{ id: string }>(
      `insert into public.webhook_events (
        organization_id, data_source_id, provider_event_id, event_type,
        signature_verified, status, payload
      ) values ($1, $2, 'evt-verified', 'products.updated', true, 'verified', '{}')
      returning id`,
      [organizationA, shopifySourceA],
    );

    expect(event.rows).toHaveLength(1);
  });
});
