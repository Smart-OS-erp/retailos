import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER_A = "60000000-0000-4000-8000-00000000001a";
const OWNER_B = "60000000-0000-4000-8000-00000000001b";
const STORE_A = "60000000-0000-4000-8000-00000000001c";
const VIEWER_A = "60000000-0000-4000-8000-00000000001d";

describe("Phase 1 inventory core foundations", () => {
  const database = new PGlite();
  let organizationA: string;
  let organizationB: string;
  let locationA1: string;
  let locationA2: string;
  let locationB1: string;
  let skuA: string;
  let skuB: string;

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
        ('${STORE_A}'),
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
        ["Phase 1 Tenant A", "phase-1-tenant-a"],
      )
    ).rows[0]!.id;

    await authenticate(OWNER_B);
    organizationB = (
      await database.query<{ id: string }>(
        "select public.create_organization($1, $2) as id",
        ["Phase 1 Tenant B", "phase-1-tenant-b"],
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
      ) values ($1, $2, 'viewer', 'active', $3)`,
      [organizationA, VIEWER_A, OWNER_A],
    );

    await authenticate(OWNER_A);
    locationA1 = (
      await database.query<{ id: string }>(
        `insert into public.locations (
          organization_id, name, code, timezone, created_by
        ) values ($1, 'Lagos Phase 1', 'lagos-phase-1', 'Africa/Lagos', $2)
        returning id`,
        [organizationA, OWNER_A],
      )
    ).rows[0]!.id;
    locationA2 = (
      await database.query<{ id: string }>(
        `insert into public.locations (
          organization_id, name, code, timezone, created_by
        ) values ($1, 'Abuja Phase 1', 'abuja-phase-1', 'Africa/Lagos', $2)
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

    await database.exec("reset role");
    const productA = (
      await database.query<{ id: string }>(
        `insert into public.products (
          organization_id, name, style_code, created_by
        ) values ($1, 'Phase 1 Jacket', 'P1-JACKET', $2)
        returning id`,
        [organizationA, OWNER_A],
      )
    ).rows[0]!.id;
    skuA = (
      await database.query<{ id: string }>(
        `insert into public.skus (
          organization_id, product_id, sku_code, barcode,
          approved_unit_cost, currency_code, created_by
        ) values ($1, $2, 'P1-SKU-A', 'P1-BARCODE-A', 12000, 'NGN', $3)
        returning id`,
        [organizationA, productA, OWNER_A],
      )
    ).rows[0]!.id;
    const uploadA = (
      await database.query<{ id: string }>(
        `insert into public.data_uploads (
          organization_id, upload_type, file_name, content_sha256,
          byte_size, row_count, status, created_by
        ) values ($1, 'sample', 'phase-1.csv', $2, 10, 1, 'consolidated', $3)
        returning id`,
        [organizationA, "6".repeat(64), OWNER_A],
      )
    ).rows[0]!.id;
    const snapshotA = (
      await database.query<{ id: string }>(
        `insert into public.inventory_snapshots (
          organization_id, upload_id, observed_at, status, created_by
        ) values ($1, $2, timezone('utc', now()), 'approved', $3)
        returning id`,
        [organizationA, uploadA, OWNER_A],
      )
    ).rows[0]!.id;
    await database.query(
      `insert into public.inventory_positions (
        organization_id, snapshot_id, sku_id, location_id, on_hand_quantity,
        approved_unit_cost, currency_code
      ) values
        ($1, $2, $3, $4, 12, 12000, 'NGN'),
        ($1, $2, $3, $5, 4, 12000, 'NGN')`,
      [organizationA, snapshotA, skuA, locationA1, locationA2],
    );

    await database.exec("reset role");
    locationB1 = (
      await database.query<{ id: string }>(
        `insert into public.locations (
          organization_id, name, code, timezone, created_by
        ) values ($1, 'Tenant B Phase 1', 'tenant-b-phase-1', 'Africa/Lagos', $2)
        returning id`,
        [organizationB, OWNER_B],
      )
    ).rows[0]!.id;
    const productB = (
      await database.query<{ id: string }>(
        `insert into public.products (
          organization_id, name, style_code, created_by
        ) values ($1, 'Tenant B Item', 'P1-B-ITEM', $2)
        returning id`,
        [organizationB, OWNER_B],
      )
    ).rows[0]!.id;
    skuB = (
      await database.query<{ id: string }>(
        `insert into public.skus (
          organization_id, product_id, sku_code, barcode,
          approved_unit_cost, currency_code, created_by
        ) values ($1, $2, 'P1-SKU-B', 'P1-BARCODE-B', 9000, 'NGN', $3)
        returning id`,
        [organizationB, productB, OWNER_B],
      )
    ).rows[0]!.id;
  }, 30_000);

  afterAll(async () => {
    await database.close();
  });

  it("creates and approves stock adjustments into the movement ledger", async () => {
    await authenticate(OWNER_A);
    const adjustmentId = (
      await database.query<{ id: string }>(
        "select public.create_stock_adjustment($1, $2, $3::jsonb) as id",
        [
          locationA1,
          "Damaged item correction",
          JSON.stringify([{ sku_id: skuA, quantity_delta: -2 }]),
        ],
      )
    ).rows[0]!.id;

    const approvedId = (
      await database.query<{ id: string }>(
        "select public.approve_stock_adjustment($1) as id",
        [adjustmentId],
      )
    ).rows[0]!.id;
    const movement = await database.query<{
      movement_type: string;
      quantity_delta: number;
      source_type: string;
    }>(
      `select movement_type, source_type, quantity_delta
       from public.inventory_movements
       where source_id = $1`,
      [adjustmentId],
    );

    expect(approvedId).toBe(adjustmentId);
    expect(movement.rows).toEqual([
      {
        movement_type: "adjustment",
        quantity_delta: -2,
        source_type: "stock_adjustment",
      },
    ]);
  });

  it("creates and approves transfers as paired ledger movements", async () => {
    await authenticate(OWNER_A);
    const transferId = (
      await database.query<{ id: string }>(
        "select public.create_transfer_request($1, $2, $3, $4::jsonb) as id",
        [
          locationA1,
          locationA2,
          "Move stock for Abuja demand",
          JSON.stringify([{ sku_id: skuA, quantity: 3 }]),
        ],
      )
    ).rows[0]!.id;

    await database.query("select public.approve_transfer_request($1)", [
      transferId,
    ]);
    const movements = await database.query<{
      location_id: string;
      movement_type: string;
      quantity_delta: number;
    }>(
      `select location_id, movement_type, quantity_delta
       from public.inventory_movements
       where source_id = $1
       order by quantity_delta`,
      [transferId],
    );

    expect(movements.rows).toEqual([
      {
        location_id: locationA1,
        movement_type: "transfer_out",
        quantity_delta: -3,
      },
      {
        location_id: locationA2,
        movement_type: "transfer_in",
        quantity_delta: 3,
      },
    ]);
  });

  it("submits stock counts and opens variance reconciliation issues", async () => {
    await authenticate(OWNER_A);
    const countId = (
      await database.query<{ id: string }>(
        "select public.submit_stock_count($1, timezone('utc', now()), $2::jsonb) as id",
        [
          locationA1,
          JSON.stringify([
            { sku_id: skuA, expected_quantity: 12, counted_quantity: 8 },
          ]),
        ],
      )
    ).rows[0]!.id;
    const issues = await database.query<{
      severity: string;
      status: string;
      variance_quantity: number;
    }>(
      `select severity, status, variance_quantity
       from public.reconciliation_issues
       where stock_count_id = $1`,
      [countId],
    );

    expect(issues.rows).toEqual([
      { severity: "medium", status: "open", variance_quantity: -4 },
    ]);
  });

  it("searches inventory by SKU and barcode within effective location scope", async () => {
    await authenticate(STORE_A);
    const scoped = await database.query<{
      location_id: string;
      sku_code: string;
    }>(
      "select location_id, sku_code from public.search_inventory_items($1, null, 25)",
      ["P1-BARCODE-A"],
    );

    expect(scoped.rows).toEqual([
      { location_id: locationA1, sku_code: "P1-SKU-A" },
    ]);

    await authenticate(OWNER_A);
    const ownerResults = await database.query<{ location_id: string }>(
      "select location_id from public.search_inventory_items($1, null, 25) order by location_id",
      ["P1-SKU-A"],
    );

    expect(ownerResults.rows.map((row) => row.location_id).sort()).toEqual(
      [locationA1, locationA2].sort(),
    );
  });

  it("denies cross-tenant and under-privileged inventory operations", async () => {
    await authenticate(OWNER_A);
    await expect(
      database.query(
        "select public.create_stock_adjustment($1, $2, $3::jsonb)",
        [
          locationB1,
          "Cross tenant attempt",
          JSON.stringify([{ sku_id: skuB, quantity_delta: 1 }]),
        ],
      ),
    ).rejects.toThrow(/permission_denied/);

    await authenticate(VIEWER_A);
    await expect(
      database.query(
        "select public.create_stock_adjustment($1, $2, $3::jsonb)",
        [
          locationA1,
          "Viewer cannot adjust",
          JSON.stringify([{ sku_id: skuA, quantity_delta: 1 }]),
        ],
      ),
    ).rejects.toThrow(/permission_denied/);

    await authenticate(STORE_A);
    await expect(
      database.query(
        "select public.create_transfer_request($1, $2, $3, $4::jsonb)",
        [
          locationA1,
          locationA2,
          "Store manager cannot move unassigned destination",
          JSON.stringify([{ sku_id: skuA, quantity: 1 }]),
        ],
      ),
    ).rejects.toThrow(/permission_denied/);
  });
});
