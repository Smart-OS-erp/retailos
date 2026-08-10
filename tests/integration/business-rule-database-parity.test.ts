import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  RETAIL_RULESET_VERSION,
  businessRuleRegistry,
  calculateAvailableInventory,
  calculateSellThrough,
} from "@/lib/business-rules";

const OWNER = "72000000-0000-4000-8000-000000000001";

describe("business-rule database parity map", () => {
  const database = new PGlite();
  let organizationId: string;
  let locationId: string;
  let skuId: string;

  async function authenticate(userId: string) {
    await database.exec("reset role");
    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
    await database.query("select set_config('request.jwt.claim.role', 'authenticated', false)");
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

      insert into auth.users (id) values ('${OWNER}');
    `);

    const migrationsDirectory = path.join(process.cwd(), "supabase", "migrations");
    const migrationNames = (await readdir(migrationsDirectory))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    for (const migrationName of migrationNames) {
      const migration = (await readFile(path.join(migrationsDirectory, migrationName), "utf8")).replace(
        "create extension if not exists pgcrypto with schema extensions;",
        "-- gen_random_uuid() is built into the PGlite PostgreSQL test engine.",
      );
      await database.exec(migration);
    }

    await authenticate(OWNER);
    organizationId = (
      await database.query<{ id: string }>("select public.create_organization($1, $2) as id", [
        "Aso Rule Parity Tenant",
        "aso-rule-parity",
      ])
    ).rows[0]!.id;

    await database.exec("reset role");

    locationId = (
      await database.query<{ id: string }>(
        `insert into public.locations (organization_id, name, code, timezone, created_by)
         values ($1, 'Lagos Island Flagship', 'lag-island', 'Africa/Lagos', $2)
         returning id`,
        [organizationId, OWNER],
      )
    ).rows[0]!.id;

    const categoryId = (
      await database.query<{ id: string }>(
        `insert into public.categories (organization_id, name, created_by)
         values ($1, 'Womenswear', $2)
         returning id`,
        [organizationId, OWNER],
      )
    ).rows[0]!.id;

    const brandId = (
      await database.query<{ id: string }>(
        `insert into public.brands (organization_id, name, code, created_by)
         values ($1, 'Aso Studio', 'aso', $2)
         returning id`,
        [organizationId, OWNER],
      )
    ).rows[0]!.id;

    const productId = (
      await database.query<{ id: string }>(
        `insert into public.products (organization_id, brand_id, category_id, name, style_code, created_by)
         values ($1, $2, $3, 'Aso parity wrapper', 'ASO-PARITY', $4)
         returning id`,
        [organizationId, brandId, categoryId, OWNER],
      )
    ).rows[0]!.id;

    skuId = (
      await database.query<{ id: string }>(
        `insert into public.skus (organization_id, product_id, sku_code, approved_unit_cost, currency_code, created_by)
         values ($1, $2, 'ASO-AB002-GOL-S', 60000, 'NGN', $3)
         returning id`,
        [organizationId, productId, OWNER],
      )
    ).rows[0]!.id;

    const uploadId = (
      await database.query<{ id: string }>(
        `insert into public.data_uploads (
          organization_id, upload_type, file_name, content_sha256, byte_size, row_count, status, created_by
        ) values ($1, 'sample', 'aso-rule-parity.csv', repeat('9', 64), 10, 1, 'consolidated', $2)
        returning id`,
        [organizationId, OWNER],
      )
    ).rows[0]!.id;

    const snapshotId = (
      await database.query<{ id: string }>(
        `insert into public.inventory_snapshots (organization_id, upload_id, observed_at, status, created_by)
         values ($1, $2, '2026-07-31T00:00:00Z', 'approved', $3)
         returning id`,
        [organizationId, uploadId, OWNER],
      )
    ).rows[0]!.id;

    await database.query(
      `insert into public.inventory_positions (
        organization_id, snapshot_id, sku_id, location_id, on_hand_quantity,
        approved_unit_cost, currency_code, units_sold_90, units_sold_30, first_available_at
      ) values ($1, $2, $3, $4, 64, 60000, 'NGN', 4, 2, '2026-01-02T00:00:00Z')`,
      [organizationId, snapshotId, skuId, locationId],
    );

    await database.query(
      `insert into public.sales_facts (
        organization_id, upload_id, sku_id, location_id, sold_at, quantity, gross_amount, currency_code, source_record_key
      ) values ($1, $2, $3, $4, '2026-07-20T00:00:00Z', 4, 240000, 'NGN', 'golden-transfer-first-lagos-to-abuja')`,
      [organizationId, uploadId, skuId, locationId],
    );
  }, 30_000);

  afterAll(async () => {
    await database.close();
  });

  it("maps every current rule to implementation and consumer evidence", () => {
    const requiredRuleIds = [
      "inventory.available_quantity",
      "inventory.position",
      "sales.net_units_sold",
      "merchandising.net_sell_through",
      "merchandising.weighted_average_weekly_net_sales",
      "merchandising.weeks_of_cover",
      "inventory.merchandise_age_weeks",
      "inventory.risk_state",
      "confidence",
      "recovery.recommendation_action",
      "merchandising.productivity",
      "markdown.eligibility_recommendation",
    ];

    expect(businessRuleRegistry.map((rule) => rule.ruleId)).toEqual(requiredRuleIds);
    for (const rule of businessRuleRegistry) {
      expect(rule.ruleVersion).toBe(RETAIL_RULESET_VERSION);
      expect(rule.definition.length).toBeGreaterThan(20);
      expect(rule.uiConsumer).not.toHaveLength(0);
      expect(rule.copilotConsumer).not.toHaveLength(0);
      expect(rule.tests.length).toBeGreaterThan(0);
    }
  });

  it("proves SQL and TypeScript parity where an equivalent database implementation exists", async () => {
    await authenticate(OWNER);
    const row = (
      await database.query<{
        available_quantity: number;
        on_hand_quantity: number;
        reserved_quantity: number;
        sell_through_rate_90: string | null;
        units_sold_90: number;
      }>(
        `select available_quantity, on_hand_quantity, reserved_quantity, units_sold_90, sell_through_rate_90
         from public.product_productivity_metrics
         where organization_id = $1 and sku_id = $2 and location_id = $3`,
        [organizationId, skuId, locationId],
      )
    ).rows[0]!;

    const available = calculateAvailableInventory({
      onHandQuantity: row.on_hand_quantity,
      reservedQuantity: row.reserved_quantity,
    });

    expect(row.available_quantity).toBe(64);
    expect(row.available_quantity).toBe(available.value);

    const canonicalSellThrough = calculateSellThrough({
      netUnitsSold: 4,
      openingAvailableInventory: 64,
      receiptsDuringPeriod: 8,
    });
    const historicalSqlSellThrough = Number(row.sell_through_rate_90);

    expect(canonicalSellThrough.value).toBe(0.0556);
    expect(historicalSqlSellThrough).toBe(5.88);
    expect(historicalSqlSellThrough).not.toBe(canonicalSellThrough.value);
  });
});
