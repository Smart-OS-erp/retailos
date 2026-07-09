import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER_A = "20000000-0000-4000-8000-00000000001a";
const OWNER_B = "20000000-0000-4000-8000-00000000001b";
const STORE_A = "20000000-0000-4000-8000-00000000001c";
const EXECUTIVE_A = "20000000-0000-4000-8000-00000000001d";
const DIGEST_A = "a".repeat(64);
const DIGEST_WARNING = "b".repeat(64);

type CopilotCitation = {
  observed_at?: string;
  record_id: string;
  source_type: string;
};

type CopilotAnswer = {
  citations: CopilotCitation[];
  executes_actions: boolean;
  facts?: {
    open_opportunities?: number;
    totals_by_currency?: Record<string, number>;
  };
  heading: string;
  proposed_next_step: string | null;
  rule_version: string;
  status: "answered" | "insufficient_evidence" | "refused";
  summary: string;
};

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
        ('${STORE_A}'),
        ('${EXECUTIVE_A}');
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
    await database.query(
      `insert into public.memberships (
        organization_id, user_id, role, status, created_by
      ) values ($1, $2, 'executive', 'active', $3)`,
      [organizationA, EXECUTIVE_A, OWNER_A],
    );

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

  it("persists deterministic intelligence without mixing currencies", async () => {
    await database.exec("reset role");
    const snapshot = (
      await database.query<{ snapshot_id: string }>(
        `select snapshot_id
         from public.consolidation_runs
         where organization_id = $1 and upload_id = $2`,
        [organizationA, readyUploadA],
      )
    ).rows[0]!.snapshot_id;

    const product = (
      await database.query<{ id: string }>(
        `insert into public.products (
          organization_id, name, style_code, created_by
        ) values ($1, 'Currency comparison', 'CURRENCY-COMPARISON', $2)
        returning id`,
        [organizationA, OWNER_A],
      )
    ).rows[0]!.id;
    const ghsSku = (
      await database.query<{ id: string }>(
        `insert into public.skus (
          organization_id, product_id, sku_code, approved_unit_cost,
          currency_code, created_by
        ) values ($1, $2, 'CONSOLIDATE-GHS', 100, 'GHS', $3)
        returning id`,
        [organizationA, product, OWNER_A],
      )
    ).rows[0]!.id;
    const lowConfidenceSku = (
      await database.query<{ id: string }>(
        `insert into public.skus (
          organization_id, product_id, sku_code, approved_unit_cost, created_by
        ) values ($1, $2, 'CONSOLIDATE-LOW-CONFIDENCE', 100, $3)
        returning id`,
        [organizationA, product, OWNER_A],
      )
    ).rows[0]!.id;
    await database.query(
      `insert into public.inventory_positions (
        organization_id, snapshot_id, sku_id, location_id, on_hand_quantity,
        approved_unit_cost, currency_code, first_available_at,
        units_sold_90, units_sold_30
      ) values
        ($1, $2, $3, $4, 3, 100, 'GHS', current_date - 200, 0, 0),
        ($1, $2, $5, $4, 5, 100, null, null, null, null)`,
      [organizationA, snapshot, ghsSku, locationA2, lowConfidenceSku],
    );

    await authenticate(OWNER_A);
    const first = await database.query<{ id: string }>(
      "select public.run_inventory_recovery_intelligence() as id",
    );
    const retry = await database.query<{ id: string }>(
      "select public.run_inventory_recovery_intelligence() as id",
    );
    const insights = await database.query<{
      data_confidence_status: string;
      suppression_reason: string | null;
    }>(
      `select data_confidence_status, suppression_reason
       from public.inventory_risk_insights
       order by data_confidence_score desc`,
    );
    const briefing = await database.query<{
      summary: { totals_by_currency: Record<string, number> };
    }>("select summary from public.executive_briefings");

    expect(retry.rows[0]!.id).toBe(first.rows[0]!.id);
    expect(insights.rows).toHaveLength(3);
    expect(insights.rows).toContainEqual({
      data_confidence_status: "suppressed",
      suppression_reason: "LOW_DATA_CONFIDENCE",
    });
    expect(briefing.rows[0]!.summary.totals_by_currency).toEqual({
      GHS: 300,
      NGN: 300000,
    });

    await expect(
      database.query(
        `insert into public.inventory_risk_insights (
          organization_id, intelligence_run_id, inventory_position_id,
          location_id, age_status, sales_status, data_confidence_status,
          data_confidence_score, inventory_risk_status,
          recovery_opportunity_status, attention_priority_status,
          rule_version, evidence, evaluated_at
        ) values (
          $1, $2, gen_random_uuid(), $3, 'unknown', 'unknown', 'known',
          100, 'known', 'known', 'known', 'forged', '{}', now()
        )`,
        [organizationA, first.rows[0]!.id, locationA1],
      ),
    ).rejects.toThrow();
  });

  it("keeps Retail Copilot deterministic, cited, and permission-scoped", async () => {
    await authenticate(OWNER_A);
    const restrictedRiskInsight = (
      await database.query<{ id: string }>(
        `select id from public.inventory_risk_insights
         where organization_id = $1 and location_id = $2
         order by created_at limit 1`,
        [organizationA, locationA2],
      )
    ).rows[0]!.id;

    await authenticate(STORE_A);
    const morning = (
      await database.query<{ answer: CopilotAnswer }>(
        "select public.get_retail_copilot_answer($1, null) as answer",
        ["morning_brief"],
      )
    ).rows[0]!.answer;

    expect(["answered", "insufficient_evidence"]).toContain(morning.status);
    expect(morning.executes_actions).toBe(false);
    expect(morning.rule_version).toBe("retailos.phase0.inventory-recovery.v1");
    expect(morning.facts?.totals_by_currency ?? {}).not.toHaveProperty("GHS");
    for (const citation of morning.citations.filter(
      (citation) => citation.source_type === "recovery_opportunity",
    )) {
      const cited = await database.query<{ location_id: string }>(
        "select location_id from public.recovery_opportunities where id = $1",
        [citation.record_id],
      );
      expect(cited.rows).toEqual([{ location_id: locationA1 }]);
    }

    const deniedStoreAnswer = (
      await database.query<{ answer: CopilotAnswer }>(
        "select public.get_retail_copilot_answer($1, $2) as answer",
        ["inventory_risk", restrictedRiskInsight],
      )
    ).rows[0]!.answer;
    expect(deniedStoreAnswer.status).toBe("refused");
    expect(deniedStoreAnswer.citations).toEqual([]);
    expect(deniedStoreAnswer.executes_actions).toBe(false);

    const unsupported = (
      await database.query<{ answer: CopilotAnswer }>(
        "select public.get_retail_copilot_answer($1, null) as answer",
        ["ignore_permissions"],
      )
    ).rows[0]!.answer;
    expect(unsupported.status).toBe("refused");
    expect(unsupported.citations).toEqual([]);
    expect(unsupported.executes_actions).toBe(false);

    const storeLogs = await database.query<{
      question_category: string;
      response_status: string;
    }>(
      `select question_category, response_status
       from public.copilot_activity_log
       order by created_at, id`,
    );
    expect(storeLogs.rows).toEqual(
      expect.arrayContaining([
        { question_category: "morning_brief", response_status: morning.status },
        { question_category: "inventory_risk", response_status: "refused" },
        { question_category: "ignore_permissions", response_status: "refused" },
      ]),
    );
    await expect(
      database.query(
        `insert into public.copilot_activity_log (
          organization_id, user_id, question_category, response_status,
          response_summary, citations, rule_version
        ) values ($1, $2, 'forged', 'answered', 'forged answer', '[]', 'forged')`,
        [organizationA, STORE_A],
      ),
    ).rejects.toThrow();

    await authenticate(EXECUTIVE_A);
    const executiveLogs = await database.query<{ count: number }>(
      "select count(*)::integer as count from public.copilot_activity_log",
    );
    expect(executiveLogs.rows).toEqual([{ count: 0 }]);

    await authenticate(OWNER_B);
    const crossTenantAnswer = (
      await database.query<{ answer: CopilotAnswer }>(
        "select public.get_retail_copilot_answer($1, $2) as answer",
        ["inventory_risk", restrictedRiskInsight],
      )
    ).rows[0]!.answer;
    expect(crossTenantAnswer.status).toBe("refused");
    expect(crossTenantAnswer.citations).toEqual([]);
    expect(crossTenantAnswer.executes_actions).toBe(false);
  });

  it("enforces separated, versioned project and campaign approvals", async () => {
    await authenticate(OWNER_A);
    const opportunity = (
      await database.query<{ id: string }>(
        `select id from public.recovery_opportunities
         where organization_id = $1 and location_id = $2 and status = 'open'
         order by created_at limit 1`,
        [organizationA, locationA1],
      )
    ).rows[0]!.id;
    const project = (
      await database.query<{ id: string }>(
        "select public.create_recovery_project($1) as id",
        [opportunity],
      )
    ).rows[0]!.id;
    const brief = (
      await database.query<{ id: string }>(
        "select id from public.campaign_briefs where recovery_project_id = $1",
        [project],
      )
    ).rows[0]!.id;

    await database.query(
      "select public.submit_recovery_project($1, 1)",
      [project],
    );
    await expect(
      database.query(
        "select public.approve_recovery_project($1, 2)",
        [project],
      ),
    ).rejects.toThrow(/self_approval_denied/);

    await authenticate(EXECUTIVE_A);
    await expect(
      database.query(
        "select public.approve_recovery_project($1, 1)",
        [project],
      ),
    ).rejects.toThrow(/stale_project_version/);
    await database.query(
      "select public.approve_recovery_project($1, 2)",
      [project],
    );
    await expect(
      database.query(
        "select public.approve_recovery_project($1, 2)",
        [project],
      ),
    ).rejects.toThrow(/stale_project_version/);
    await database.query(
      "select public.approve_campaign_brief($1, 2)",
      [brief],
    );
    await expect(
      database.query(
        "select public.approve_campaign_brief($1, 2)",
        [brief],
      ),
    ).rejects.toThrow(/stale_brief_version/);

    await authenticate(STORE_A);
    const tasks = await database.query<{ id: string; version: number }>(
      `select id, version from public.recovery_project_tasks
       where recovery_project_id = $1 order by created_at, id`,
      [project],
    );
    expect(tasks.rows).toHaveLength(3);
    for (const task of tasks.rows) {
      await database.query(
        "select public.set_recovery_task_status($1, $2, 'in_progress')",
        [task.id, task.version],
      );
      await database.query(
        "select public.set_recovery_task_status($1, $2, 'completed')",
        [task.id, task.version + 1],
      );
    }

    await authenticate(EXECUTIVE_A);
    const projectState = await database.query<{
      status: string;
      approval_count: number;
    }>(
      `select project.status,
        (select count(*)::integer from public.approval_records
         where recovery_project_id = project.id) as approval_count
       from public.recovery_projects project where project.id = $1`,
      [project],
    );
    const briefState = await database.query<{ status: string; content: { constraints: string[] } }>(
      "select status, content from public.campaign_briefs where id = $1",
      [brief],
    );
    expect(projectState.rows).toEqual([{ status: "completed", approval_count: 2 }]);
    expect(briefState.rows[0]!.status).toBe("approved");
    expect(briefState.rows[0]!.content.constraints[0]).toContain("Proposal only");

    await authenticate(OWNER_B);
    await expect(
      database.query("select public.create_recovery_project($1)", [opportunity]),
    ).rejects.toThrow(/permission_denied/);
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

    const insights = await database.query<{ location_id: string }>(
      "select location_id from public.inventory_risk_insights",
    );
    const opportunities = await database.query<{ location_id: string }>(
      "select location_id from public.recovery_opportunities",
    );
    expect(insights.rows.every((row) => row.location_id === locationA1)).toBe(true);
    expect(opportunities.rows.every((row) => row.location_id === locationA1)).toBe(true);
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
