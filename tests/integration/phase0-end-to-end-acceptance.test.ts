import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER = "30000000-0000-4000-8000-000000000001";
const EXECUTIVE = "30000000-0000-4000-8000-000000000002";
const STORE_MANAGER = "30000000-0000-4000-8000-000000000003";
const VIEWER = "30000000-0000-4000-8000-000000000004";
const OTHER_OWNER = "30000000-0000-4000-8000-000000000005";
const DIGEST = "0".repeat(64);
const BLOCKED_DIGEST = "1".repeat(64);

type Catalogue = {
  skus: Array<{
    name: string;
    price_ngn: number;
    receipt_date: string | null;
    sku: string;
  }>;
};

type InventoryFixture = {
  records: Array<{
    available_quantity: number;
    currency: string;
    first_available_date: string | null;
    location_code: string;
    on_hand_quantity: number;
    sku: string;
    unit_cost_ngn: number | null;
  }>;
};

type CopilotAnswer = {
  citations: Array<{ record_id: string; source_type: string }>;
  executes_actions: boolean;
  status: "answered" | "insufficient_evidence" | "refused";
  summary: string;
};

describe("M0.21 Phase 0 end-to-end acceptance", () => {
  const database = new PGlite();
  let organizationId: string;
  let uploadId: string;
  let blockedUploadId: string;
  let locationIds: Record<string, string>;

  async function authenticate(userId: string) {
    await database.exec("reset role");
    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [
      userId,
    ]);
    await database.query(
      "select set_config('request.jwt.claim.role', 'authenticated', false)",
    );
    await database.exec("set role authenticated");
  }

  async function loadJson<T>(relativePath: string): Promise<T> {
    return JSON.parse(
      await readFile(path.join(process.cwd(), "data", "demo", "aso-collective", relativePath), "utf8"),
    ) as T;
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
        ('${OWNER}'),
        ('${EXECUTIVE}'),
        ('${STORE_MANAGER}'),
        ('${VIEWER}'),
        ('${OTHER_OWNER}');
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

    await authenticate(OWNER);
    organizationId = (
      await database.query<{ id: string }>(
        "select public.create_organization($1, $2) as id",
        ["Aṣọ Collective", "aso-collective"],
      )
    ).rows[0]!.id;

    await authenticate(OTHER_OWNER);
    const otherOrganizationId = (
      await database.query<{ id: string }>(
        "select public.create_organization($1, $2) as id",
        ["Other Tenant", "other-tenant"],
      )
    ).rows[0]!.id;
    expect(otherOrganizationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    await database.exec("reset role");
    const executiveMembership = (
      await database.query<{ id: string }>(
        `insert into public.memberships (
          organization_id, user_id, role, status, created_by
        ) values ($1, $2, 'executive', 'active', $3)
        returning id`,
        [organizationId, EXECUTIVE, OWNER],
      )
    ).rows[0]!.id;
    const storeMembership = (
      await database.query<{ id: string }>(
        `insert into public.memberships (
          organization_id, user_id, role, status, created_by
        ) values ($1, $2, 'store_manager', 'active', $3)
        returning id`,
        [organizationId, STORE_MANAGER, OWNER],
      )
    ).rows[0]!.id;
    await database.query(
      `insert into public.memberships (
        organization_id, user_id, role, status, created_by
      ) values ($1, $2, 'viewer', 'active', $3)`,
      [organizationId, VIEWER, OWNER],
    );

    await authenticate(OWNER);
    const locations = await loadJson<Array<{ code: string; name: string; timezone: string }>>(
      "locations.json",
    );
    locationIds = {};
    for (const location of locations) {
      locationIds[location.code] = (
        await database.query<{ id: string }>(
          `insert into public.locations (
            organization_id, name, code, timezone, created_by
          ) values ($1, $2, $3, $4, $5)
          returning id`,
          [
            organizationId,
            location.name,
            location.code.toLowerCase(),
            location.timezone,
            OWNER,
          ],
        )
      ).rows[0]!.id;
    }
    await database.query(
      `insert into public.location_assignments (
        organization_id, location_id, membership_id, created_by
      ) values ($1, $2, $3, $4), ($1, $5, $6, $4)`,
      [
        organizationId,
        locationIds["LAG-ISL"],
        storeMembership,
        OWNER,
        locationIds["LAG-ISL"],
        executiveMembership,
      ],
    );

    const catalogue = await loadJson<Catalogue>("catalogue.json");
    const inventory = await loadJson<InventoryFixture>("inventory/snapshots.json");
    const selectedRows = inventory.records
      .filter(
        (row) =>
          row.location_code === "LAG-ISL" &&
          row.on_hand_quantity > 0 &&
          row.unit_cost_ngn !== null,
      )
      .slice(0, 4);

    uploadId = (
      await database.query<{ id: string }>(
        `insert into public.data_uploads (
          organization_id, upload_type, file_name, content_sha256,
          byte_size, row_count, status, created_by
        ) values ($1, 'inventory_csv', 'ASO_PHASE0_DATASET_V1_inventory.csv', $2, 2048, $3, 'parsed', $4)
        returning id`,
        [organizationId, DIGEST, selectedRows.length, OWNER],
      )
    ).rows[0]!.id;

    let rowNumber = 1;
    for (const row of selectedRows) {
      const sku = catalogue.skus.find((item) => item.sku === row.sku)!;
      const rawRowId = (
        await database.query<{ id: string }>(
          `insert into public.raw_upload_rows (
            organization_id, upload_id, row_number, payload
          ) values ($1, $2, $3, $4::jsonb)
          returning id`,
          [
            organizationId,
            uploadId,
            rowNumber,
            JSON.stringify({
              dataset_version: "ASO_PHASE0_DATASET_V1",
              location_code: row.location_code,
              sku: row.sku,
              source_system: "inventory_spreadsheet",
            }),
          ],
        )
      ).rows[0]!.id;
      await database.query(
        `insert into public.staging_inventory_rows (
          organization_id, upload_id, raw_row_id, location_id, sku_code,
          product_name, location_code, on_hand_quantity, approved_unit_cost,
          currency_code, first_available_at, units_sold_90, units_sold_30,
          validation_status
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'NGN', $10, $11, $12, $13)`,
        [
          organizationId,
          uploadId,
          rawRowId,
          locationIds[row.location_code],
          row.sku,
          sku.name,
          row.location_code.toLowerCase(),
          row.on_hand_quantity,
          row.unit_cost_ngn,
          row.first_available_date,
          1,
          rowNumber === 1 ? 0 : 1,
          rowNumber === 1 ? "warning" : "valid",
        ],
      );
      rowNumber += 1;
    }
    const warningRow = (
      await database.query<{ id: string }>(
        `select id from public.staging_inventory_rows
         where organization_id = $1 and upload_id = $2 and validation_status = 'warning'
         limit 1`,
        [organizationId, uploadId],
      )
    ).rows[0]!.id;
    await database.query(
      `insert into public.validation_issues (
        organization_id, upload_id, staging_row_id, severity, issue_code, message
      ) values ($1, $2, $3, 'warning', 'missing_receipt_date_proxy', 'Receipt date required proxy confidence review.')`,
      [organizationId, uploadId, warningRow],
    );

    blockedUploadId = (
      await database.query<{ id: string }>(
        `insert into public.data_uploads (
          organization_id, upload_type, file_name, content_sha256,
          byte_size, row_count, status, created_by
        ) values ($1, 'inventory_csv', 'ASO_PHASE0_DATASET_V1_invalid.csv', $2, 512, 1, 'validation_blocked', $3)
        returning id`,
        [organizationId, BLOCKED_DIGEST, OWNER],
      )
    ).rows[0]!.id;
    const blockedRawRowId = (
      await database.query<{ id: string }>(
        `insert into public.raw_upload_rows (
          organization_id, upload_id, row_number, payload
        ) values ($1, $2, 1, '{"dataset_version":"ASO_PHASE0_DATASET_V1","location_code":"INVALID"}')
        returning id`,
        [organizationId, blockedUploadId],
      )
    ).rows[0]!.id;
    const blockedStagingId = (
      await database.query<{ id: string }>(
        `insert into public.staging_inventory_rows (
          organization_id, upload_id, raw_row_id, sku_code, product_name,
          location_code, on_hand_quantity, validation_status
        ) values ($1, $2, $3, 'INVALID-SKU', 'Invalid source row', 'UNKNOWN', 1, 'blocked')
        returning id`,
        [organizationId, blockedUploadId, blockedRawRowId],
      )
    ).rows[0]!.id;
    await database.query(
      `insert into public.validation_issues (
        organization_id, upload_id, staging_row_id, severity, issue_code, message
      ) values ($1, $2, $3, 'blocking', 'invalid_location', 'Location does not exist in tenant.')`,
      [organizationId, blockedUploadId, blockedStagingId],
    );
  }, 30_000);

  afterAll(async () => {
    await database.close();
  });

  it("blocks invalid source data and accepts reviewable warnings before consolidation", async () => {
    await authenticate(OWNER);
    await expect(
      database.query("select public.consolidate_inventory_upload($1, $2)", [
        blockedUploadId,
        BLOCKED_DIGEST,
      ]),
    ).rejects.toThrow(/upload_not_ready|validation_not_clear/);

    await database.query("select public.accept_inventory_upload_warnings($1)", [
      uploadId,
    ]);
    const warningState = await database.query<{
      accepted: number;
      staged_warnings: number;
      upload_status: string;
    }>(
      `select
        (select count(*)::integer from public.validation_issues where upload_id = $1 and accepted_at is not null) as accepted,
        (select count(*)::integer from public.staging_inventory_rows where upload_id = $1 and validation_status = 'warning') as staged_warnings,
        (select status from public.data_uploads where id = $1) as upload_status`,
      [uploadId],
    );
    expect(warningState.rows).toEqual([
      { accepted: 1, staged_warnings: 0, upload_status: "ready" },
    ]);
  });

  it("runs the full Phase 0 path with lineage, confidence, recovery, projectisation, tasks, and Copilot evidence", async () => {
    await authenticate(OWNER);
    const run = (
      await database.query<{ id: string }>(
        "select public.consolidate_inventory_upload($1, $2) as id",
        [uploadId, DIGEST],
      )
    ).rows[0]!.id;
    const retry = (
      await database.query<{ id: string }>(
        "select public.consolidate_inventory_upload($1, $2) as id",
        [uploadId, DIGEST],
      )
    ).rows[0]!.id;
    expect(retry).toBe(run);

    const operatingView = await database.query<{ count: number }>(
      "select count(*)::integer as count from public.current_inventory_positions",
    );
    expect(operatingView.rows[0]!.count).toBe(4);

    const intelligenceRun = (
      await database.query<{ id: string }>(
        "select public.run_inventory_recovery_intelligence() as id",
      )
    ).rows[0]!.id;
    const confidence = await database.query<{
      data_confidence_status: string;
      inventory_risk_status: string;
      recovery_opportunity_status: string;
    }>(
      `select data_confidence_status, inventory_risk_status, recovery_opportunity_status
       from public.inventory_risk_insights
       where intelligence_run_id = $1
       order by data_confidence_score desc
       limit 1`,
      [intelligenceRun],
    );
    expect(confidence.rows[0]).toMatchObject({
      data_confidence_status: "known",
      inventory_risk_status: "known",
      recovery_opportunity_status: "known",
    });

    const opportunity = (
      await database.query<{
        attention_priority_score: number;
        id: string;
        status: string;
      }>(
        `select id, status, attention_priority_score
         from public.recovery_opportunities
         where organization_id = $1
         order by attention_priority_score desc
         limit 1`,
        [organizationId],
      )
    ).rows[0]!;
    expect(opportunity.status).toBe("open");
    expect(Number(opportunity.attention_priority_score)).toBeGreaterThan(0);

    const projectId = (
      await database.query<{ id: string }>(
        "select public.create_recovery_project($1) as id",
        [opportunity.id],
      )
    ).rows[0]!.id;
    const submittedVersion = (
      await database.query<{ version: number }>(
        "select public.submit_recovery_project($1, 1) as version",
        [projectId],
      )
    ).rows[0]!.version;

    await authenticate(EXECUTIVE);
    const approvedVersion = (
      await database.query<{ version: number }>(
        "select public.approve_recovery_project($1, $2) as version",
        [projectId, submittedVersion],
      )
    ).rows[0]!.version;
    expect(approvedVersion).toBe(submittedVersion + 1);

    const brief = (
      await database.query<{ id: string; version: number }>(
        `select id, version from public.campaign_briefs
         where recovery_project_id = $1`,
        [projectId],
      )
    ).rows[0]!;
    const briefVersion = (
      await database.query<{ version: number }>(
        "select public.approve_campaign_brief($1, $2) as version",
        [brief.id, brief.version],
      )
    ).rows[0]!.version;
    expect(briefVersion).toBe(brief.version + 1);

    await authenticate(OWNER);
    const task = (
      await database.query<{ id: string; version: number }>(
        `select id, version from public.recovery_project_tasks
         where recovery_project_id = $1
         order by created_at, id
         limit 1`,
        [projectId],
      )
    ).rows[0]!;
    const taskVersion = (
      await database.query<{ version: number }>(
        "select public.set_recovery_task_status($1, $2, 'in_progress') as version",
        [task.id, task.version],
      )
    ).rows[0]!.version;
    expect(taskVersion).toBe(task.version + 1);

    const copilot = (
      await database.query<{ answer: CopilotAnswer }>(
        "select public.get_retail_copilot_answer($1, $2) as answer",
        ["project", projectId],
      )
    ).rows[0]!.answer;
    expect(copilot.executes_actions).toBe(false);
    expect(copilot.status).toBe("answered");
    expect(copilot.summary).toContain("evidence");
    expect(copilot.citations.length).toBeGreaterThan(0);

    const lineage = await database.query<{
      audit_events: number;
      campaign_briefs: number;
      consolidation_items: number;
      source_upload_id: string;
      tasks: number;
    }>(
      `select
        (select count(*)::integer from public.consolidation_items where consolidation_run_id = $1) as consolidation_items,
        (select source_evidence ->> 'upload_id' from public.consolidation_items where consolidation_run_id = $1 limit 1) as source_upload_id,
        (select count(*)::integer from public.campaign_briefs where recovery_project_id = $2) as campaign_briefs,
        (select count(*)::integer from public.recovery_project_tasks where recovery_project_id = $2) as tasks,
        (select count(*)::integer from public.audit_events where organization_id = $3) as audit_events`,
      [run, projectId, organizationId],
    );
    expect(lineage.rows[0]).toMatchObject({
      campaign_briefs: 1,
      consolidation_items: 4,
      source_upload_id: uploadId,
      tasks: 3,
    });
    expect(lineage.rows[0]!.audit_events).toBeGreaterThanOrEqual(4);
  });

  it("enforces tenant, role, and location isolation in the acceptance journey", async () => {
    await authenticate(OTHER_OWNER);
    const otherTenantPositions = await database.query<{ count: number }>(
      "select count(*)::integer as count from public.current_inventory_positions",
    );
    expect(otherTenantPositions.rows).toEqual([{ count: 0 }]);

    await authenticate(VIEWER);
    await expect(
      database.query("select public.run_inventory_recovery_intelligence()"),
    ).rejects.toThrow(/permission_denied/);

    await authenticate(STORE_MANAGER);
    const visiblePositions = await database.query<{ location_id: string }>(
      "select location_id from public.current_inventory_positions",
    );
    expect(new Set(visiblePositions.rows.map((row) => row.location_id))).toEqual(
      new Set([locationIds["LAG-ISL"]]),
    );
  });
});
