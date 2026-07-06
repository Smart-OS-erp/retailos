import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER_A = "20000000-0000-4000-8000-00000000001a";
const OWNER_B = "20000000-0000-4000-8000-00000000001b";
const STORE_A = "20000000-0000-4000-8000-00000000001c";
const DIGEST_A = "a".repeat(64);
const DIGEST_WARNING = "b".repeat(64);

describe("Phase 0 Consolidation Hub", () => {
  const database = new PGlite();
  let organizationA: string;
  let organizationB: string;
  let locationA1: string;
  let locationA2: string;
  let readyUploadA: string;
  let warningUploadA: string;
  let blockedUploadA: string;

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

  async function insertStagedUpload(input: {
    digest: string;
    locationId: string;
    organizationId: string;
    ownerId: string;
    status: "parsed" | "ready" | "validation_blocked";
    validationStatus: "blocked" | "valid" | "warning";
  }) {
    const upload = (
      await database.query<{ id: string }>(
        `insert into public.data_uploads (
          organization_id, upload_type, file_name, content_sha256, byte_size,
          row_count, status, created_by
        ) values ($1, 'inventory_csv', $2, $3, 100, 1, $4, $5)
        returning id`,
        [
          input.organizationId,
          `${input.digest.slice(0, 4)}.csv`,
          input.digest,
          input.status,
          input.ownerId,
        ],
      )
    ).rows[0]!.id;
    const raw = (
      await database.query<{ id: string }>(
        `insert into public.raw_upload_rows (
          organization_id, upload_id, row_number, payload
        ) values ($1, $2, 1, '{"sku_code":"CONSOLIDATE-1"}')
        returning id`,
        [input.organizationId, upload],
      )
    ).rows[0]!.id;
    const staging = (
      await database.query<{ id: string }>(
        `insert into public.staging_inventory_rows (
          organization_id, upload_id, raw_row_id, location_id, sku_code,
          product_name, on_hand_quantity, approved_unit_cost, currency_code,
          first_available_at, units_sold_90, units_sold_30, validation_status
        ) values (
          $1, $2, $3, $4, 'CONSOLIDATE-1', 'Consolidation coat', 12,
          25000, 'NGN', current_date - 120, 2, 0, $5
        ) returning id`,
        [
          input.organizationId,
          upload,
          raw,
          input.locationId,
          input.validationStatus,
        ],
      )
    ).rows[0]!.id;
    return { staging, upload };
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
        ('${STORE_A}');
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
        ["Consolidation A", "consolidation-a"],
      )
    ).rows[0]!.id;
    await authenticate(OWNER_B);
    organizationB = (
      await database.query<{ id: string }>(
        "select public.create_organization($1, $2) as id",
        ["Consolidation B", "consolidation-b"],
      )
    ).rows[0]!.id;

    await database.exec("reset role");
    const storeMembership = (
      await database.query<{ id: string }>(
        `insert into public.memberships (
          organization_id, user_id, role, status, created_by
        ) values ($1, $2, 'store_manager', 'active', $3)
        returning id`,
        [organizationA, STORE_A, OWNER_A],
      )
    ).rows[0]!.id;

    await authenticate(OWNER_A);
    locationA1 = (
      await database.query<{ id: string }>(
        `insert into public.locations (
          organization_id, name, code, timezone, created_by
        ) values ($1, 'Lagos Consolidation', 'lagos-consolidation', 'Africa/Lagos', $2)
        returning id`,
        [organizationA, OWNER_A],
      )
    ).rows[0]!.id;
    locationA2 = (
      await database.query<{ id: string }>(
        `insert into public.locations (
          organization_id, name, code, timezone, created_by
        ) values ($1, 'Abuja Consolidation', 'abuja-consolidation', 'Africa/Lagos', $2)
        returning id`,
        [organizationA, OWNER_A],
      )
    ).rows[0]!.id;
    await database.query(
      `insert into public.location_assignments (
        organization_id, location_id, membership_id, created_by
      ) values ($1, $2, $3, $4)`,
      [organizationA, locationA1, storeMembership, OWNER_A],
    );

    readyUploadA = (
      await insertStagedUpload({
        digest: DIGEST_A,
        locationId: locationA1,
        organizationId: organizationA,
        ownerId: OWNER_A,
        status: "ready",
        validationStatus: "valid",
      })
    ).upload;
    const warning = await insertStagedUpload({
      digest: DIGEST_WARNING,
      locationId: locationA2,
      organizationId: organizationA,
      ownerId: OWNER_A,
      status: "parsed",
      validationStatus: "warning",
    });
    warningUploadA = warning.upload;
    await database.query(
      `insert into public.validation_issues (
        organization_id, upload_id, staging_row_id, severity, issue_code, message
      ) values ($1, $2, $3, 'warning', 'missing_cost_evidence', 'Review missing source evidence.')`,
      [organizationA, warning.upload, warning.staging],
    );
    const blocked = await insertStagedUpload({
      digest: "c".repeat(64),
      locationId: locationA2,
      organizationId: organizationA,
      ownerId: OWNER_A,
      status: "validation_blocked",
      validationStatus: "blocked",
    });
    blockedUploadA = blocked.upload;
    await database.query(
      `insert into public.validation_issues (
        organization_id, upload_id, staging_row_id, severity, issue_code, message
      ) values ($1, $2, $3, 'blocking', 'invalid_quantity', 'Quantity is invalid.')`,
      [organizationA, blocked.upload, blocked.staging],
    );
  }, 30_000);

  afterAll(async () => {
    await database.close();
  });

  it("consolidates atomically with audit, outbox, and immutable lineage", async () => {
    await authenticate(OWNER_A);
    const first = await database.query<{ id: string }>(
      "select public.consolidate_inventory_upload($1, $2) as id",
      [readyUploadA, DIGEST_A],
    );
    const runId = first.rows[0]!.id;
    const runs = await database.query<{
      approval_evidence_sha256: string;
      status: string;
    }>(
      "select status, approval_evidence_sha256 from public.consolidation_runs where id = $1",
      [runId],
    );
    const items = await database.query<{ source_evidence: { upload_id: string } }>(
      "select source_evidence from public.consolidation_items where consolidation_run_id = $1",
      [runId],
    );
    const audits = await database.query<{ action: string }>(
      "select action from public.audit_events where target_id = $1",
      [runId],
    );
    const events = await database.query<{ event_type: string }>(
      "select event_type from public.event_log where aggregate_id = $1",
      [runId],
    );

    expect(runs.rows).toEqual([
      { status: "completed", approval_evidence_sha256: DIGEST_A },
    ]);
    expect(items.rows).toHaveLength(1);
    expect(items.rows[0]!.source_evidence.upload_id).toBe(readyUploadA);
    expect(audits.rows).toEqual([{ action: "inventory_upload.consolidated" }]);
    expect(events.rows).toEqual([{ event_type: "inventory.consolidated" }]);
  });

  it("returns the original run on retry and rejects changed evidence", async () => {
    await authenticate(OWNER_A);
    const first = await database.query<{ id: string }>(
      "select public.consolidate_inventory_upload($1, $2) as id",
      [readyUploadA, DIGEST_A],
    );
    const retry = await database.query<{ id: string }>(
      "select public.consolidate_inventory_upload($1, $2) as id",
      [readyUploadA, DIGEST_A],
    );
    const positions = await database.query<{ count: number }>(
      "select count(*)::integer as count from public.inventory_positions",
    );

    expect(retry.rows[0]!.id).toBe(first.rows[0]!.id);
    expect(positions.rows).toEqual([{ count: 1 }]);
    await expect(
      database.query(
        "select public.consolidate_inventory_upload($1, $2)",
        [readyUploadA, "d".repeat(64)],
      ),
    ).rejects.toThrow(/source_changed/);
  });

  it("requires explicit warning acceptance and never accepts blockers", async () => {
    await authenticate(OWNER_A);
    await database.query(
      "select public.accept_inventory_upload_warnings($1)",
      [warningUploadA],
    );
    const warningState = await database.query<{
      status: string;
      warnings_accepted_by: string;
    }>(
      "select status, warnings_accepted_by from public.data_uploads where id = $1",
      [warningUploadA],
    );
    expect(warningState.rows).toEqual([
      { status: "ready", warnings_accepted_by: OWNER_A },
    ]);

    await expect(
      database.query(
        "select public.accept_inventory_upload_warnings($1)",
        [blockedUploadA],
      ),
    ).rejects.toThrow(/upload_not_warning_reviewable|blocking_issues_present/);
  });

  it("keeps the Operating View assigned-location scoped", async () => {
    await authenticate(STORE_A);
    const positions = await database.query<{
      location_id: string;
      sku_code: string;
    }>("select location_id, sku_code from public.current_inventory_positions");

    expect(positions.rows).toEqual([
      { location_id: locationA1, sku_code: "CONSOLIDATE-1" },
    ]);
    expect(positions.rows).not.toContainEqual({
      location_id: locationA2,
      sku_code: "CONSOLIDATE-1",
    });
  });

  it("rejects cross-tenant and anonymous consolidation calls", async () => {
    await authenticate(OWNER_B);
    await expect(
      database.query(
        "select public.consolidate_inventory_upload($1, $2)",
        [readyUploadA, DIGEST_A],
      ),
    ).rejects.toThrow(/permission_denied/);

    await database.exec("reset role");
    await database.exec("set role anon");
    await expect(
      database.query(
        "select public.consolidate_inventory_upload($1, $2)",
        [readyUploadA, DIGEST_A],
      ),
    ).rejects.toThrow();
    expect(organizationB).not.toBe(organizationA);
  });
});
