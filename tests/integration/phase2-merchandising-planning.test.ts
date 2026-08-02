import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER = "71000000-0000-4000-8000-000000000001";
const MERCHANDISER = "71000000-0000-4000-8000-000000000002";
const VIEWER = "71000000-0000-4000-8000-000000000003";
const STORE = "71000000-0000-4000-8000-000000000004";

describe("Phase 2 merchandising and planning milestones M2.0-M2.6", () => {
  const database = new PGlite();
  let organizationId: string;
  let locationId: string;
  let productId: string;

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
        ('${OWNER}'),
        ('${MERCHANDISER}'),
        ('${VIEWER}'),
        ('${STORE}');
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
        ["Phase 2 Tenant", "phase-2-tenant"],
      )
    ).rows[0]!.id;

    await database.exec("reset role");
    await database.query(
      `insert into public.memberships (organization_id, user_id, role, status, created_by)
       values
        ($1, $2, 'merchandising_manager', 'active', $3),
        ($1, $4, 'viewer', 'active', $3),
        ($1, $5, 'store_manager', 'active', $3)`,
      [organizationId, MERCHANDISER, OWNER, VIEWER, STORE],
    );

    const location = (
      await database.query<{ id: string }>(
        `insert into public.locations (organization_id, name, code, timezone, created_by)
         values ($1, 'Phase 2 Lagos', 'p2-lag', 'Africa/Lagos', $2)
         returning id`,
        [organizationId, OWNER],
      )
    ).rows[0]!;
    locationId = location.id;

    const viewerMembershipId = (
      await database.query<{ id: string }>(
        `select id
         from public.memberships
         where organization_id = $1 and user_id = $2`,
        [organizationId, VIEWER],
      )
    ).rows[0]!.id;
    await database.query(
      `insert into public.location_assignments (
        organization_id, location_id, membership_id, created_by
      ) values ($1, $2, $3, $4)`,
      [organizationId, locationId, viewerMembershipId, OWNER],
    );

    const categoryId = (
      await database.query<{ id: string }>(
        `insert into public.categories (organization_id, name, created_by)
         values ($1, 'Women', $2)
         returning id`,
        [organizationId, OWNER],
      )
    ).rows[0]!.id;
    const brandId = (
      await database.query<{ id: string }>(
        `insert into public.brands (organization_id, name, code, created_by)
         values ($1, 'Adaa', 'adaa', $2)
         returning id`,
        [organizationId, OWNER],
      )
    ).rows[0]!.id;
    productId = (
      await database.query<{ id: string }>(
        `insert into public.products (organization_id, brand_id, category_id, name, style_code, created_by)
         values ($1, $2, $3, 'Linen blazer', 'LIN-BLAZER', $4)
         returning id`,
        [organizationId, brandId, categoryId, OWNER],
      )
    ).rows[0]!.id;
    const skuId = (
      await database.query<{ id: string }>(
        `insert into public.skus (organization_id, product_id, sku_code, approved_unit_cost, currency_code, created_by)
         values ($1, $2, 'LIN-BLAZER-M', 12000, 'NGN', $3)
         returning id`,
        [organizationId, productId, OWNER],
      )
    ).rows[0]!.id;
    const uploadId = (
      await database.query<{ id: string }>(
        `insert into public.data_uploads (
          organization_id, upload_type, file_name, content_sha256, byte_size, row_count, status, created_by
        ) values ($1, 'sample', 'phase2.csv', repeat('8', 64), 10, 1, 'consolidated', $2)
        returning id`,
        [organizationId, OWNER],
      )
    ).rows[0]!.id;
    const snapshotId = (
      await database.query<{ id: string }>(
        `insert into public.inventory_snapshots (organization_id, upload_id, observed_at, status, created_by)
         values ($1, $2, timezone('utc', now()), 'approved', $3)
         returning id`,
        [organizationId, uploadId, OWNER],
      )
    ).rows[0]!.id;

    await database.query(
      `insert into public.inventory_positions (
        organization_id, snapshot_id, sku_id, location_id, on_hand_quantity,
        approved_unit_cost, currency_code, units_sold_90, units_sold_30
      ) values ($1, $2, $3, $4, 24, 12000, 'NGN', 0, 0)`,
      [organizationId, snapshotId, skuId, locationId],
    );
  }, 30_000);

  afterAll(async () => {
    await database.close();
  });

  it("exposes historical productivity only to merchandising-visible roles", async () => {
    await authenticate(VIEWER);
    const viewerMetrics = await database.query<{ planning_signal: string }>(
      `select planning_signal
       from public.product_productivity_metrics
       where organization_id = $1`,
      [organizationId],
    );
    expect(viewerMetrics.rows).toHaveLength(1);
    expect(viewerMetrics.rows[0]!.planning_signal).toBe("markdown_review");

    await authenticate(STORE);
    const storeMetrics = await database.query(
      `select *
       from public.product_productivity_metrics
       where organization_id = $1`,
      [organizationId],
    );
    expect(storeMetrics.rows).toHaveLength(0);
  });

  it("generates planning recommendations and drafts without execution side effects", async () => {
    await authenticate(VIEWER);
    await expect(
      database.query("select public.generate_merchandising_recommendations($1)", [
        organizationId,
      ]),
    ).rejects.toThrow(/permission_denied/);

    await authenticate(MERCHANDISER);
    const generated = (
      await database.query<{ count: number }>(
        "select public.generate_merchandising_recommendations($1) as count",
        [organizationId],
      )
    ).rows[0]!.count;
    expect(generated).toBeGreaterThan(0);

    const recommendation = (
      await database.query<{
        confidence_level: string;
        id: string;
        recommendation_type: string;
      }>(
        `select id, recommendation_type, confidence_level
         from public.merchandising_recommendations
         where organization_id = $1
         order by created_at desc
         limit 1`,
        [organizationId],
      )
    ).rows[0]!;
    expect(recommendation.recommendation_type).toBe("markdown");
    expect(recommendation.confidence_level).toBe("low");

    const draftId = (
      await database.query<{ id: string }>(
        "select public.create_markdown_plan_draft($1, 15, $2) as id",
        [recommendation.id, "Historical no-sales stock exposure requires a controlled markdown review."],
      )
    ).rows[0]!.id;
    expect(draftId).toMatch(/[0-9a-f-]{36}/);

    const draft = (
      await database.query<{ discount: number; status: string }>(
        `select recommended_discount_percent as discount, status
         from public.markdown_plan_drafts
         where id = $1`,
        [draftId],
      )
    ).rows[0]!;
    expect(draft).toEqual({ discount: 15, status: "draft" });

    const converted = (
      await database.query<{ status: string }>(
        "select status from public.merchandising_recommendations where id = $1",
        [recommendation.id],
      )
    ).rows[0]!;
    expect(converted.status).toBe("converted");
  });

  it("creates and approves planning cycles with auditable assortment items", async () => {
    await authenticate(MERCHANDISER);
    const cycleId = (
      await database.query<{ id: string }>(
        "select public.create_merchandising_plan_cycle($1, 'assortment', 'SS27 Lagos edit', 'Pilot assortment plan') as id",
        [organizationId],
      )
    ).rows[0]!.id;

    const itemId = (
      await database.query<{ id: string }>(
        "select public.add_assortment_plan_item($1, $2, 'review', 1, 'Validate role with consultant') as id",
        [cycleId, productId],
      )
    ).rows[0]!.id;
    expect(itemId).toMatch(/[0-9a-f-]{36}/);

    const approvedId = (
      await database.query<{ id: string }>(
        "select public.approve_merchandising_plan_cycle($1) as id",
        [cycleId],
      )
    ).rows[0]!.id;
    expect(approvedId).toBe(cycleId);

    const cycle = (
      await database.query<{ status: string }>(
        "select status from public.merchandising_plan_cycles where id = $1",
        [cycleId],
      )
    ).rows[0]!;
    expect(cycle.status).toBe("approved");

    await authenticate(OWNER);
    const audit = await database.query<{ action: string }>(
      `select action
       from public.audit_events
       where organization_id = $1
         and (action like 'merchandising_%' or action = 'assortment_plan_item.upserted')
       order by created_at`,
      [organizationId],
    );
    expect(audit.rows.map((row) => row.action)).toEqual(
      expect.arrayContaining([
        "merchandising_recommendations.generated",
        "merchandising_plan_cycle.created",
        "merchandising_plan_cycle.approved",
        "assortment_plan_item.upserted",
      ]),
    );
  });
});
