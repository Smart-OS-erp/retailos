import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER_A = "10000000-0000-4000-8000-00000000001a";
const OWNER_B = "10000000-0000-4000-8000-00000000001b";
const STORE_A = "10000000-0000-4000-8000-00000000001c";
const VIEWER_A = "10000000-0000-4000-8000-00000000001d";

describe("Phase 0 data foundation isolation", () => {
  const database = new PGlite();
  let organizationA: string;
  let organizationB: string;
  let locationA1: string;
  let locationA2: string;
  let locationB1: string;
  let uploadA: string;
  let uploadB: string;

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
        ["Data Tenant A", "data-tenant-a"],
      )
    ).rows[0]!.id;

    await authenticate(OWNER_B);
    organizationB = (
      await database.query<{ id: string }>(
        "select public.create_organization($1, $2) as id",
        ["Data Tenant B", "data-tenant-b"],
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
        ) values ($1, 'Lagos', 'lagos-data', 'Africa/Lagos', $2)
        returning id`,
        [organizationA, OWNER_A],
      )
    ).rows[0]!.id;
    locationA2 = (
      await database.query<{ id: string }>(
        `insert into public.locations (
          organization_id, name, code, timezone, created_by
        ) values ($1, 'Abuja', 'abuja-data', 'Africa/Lagos', $2)
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

    const categoryA = (
      await database.query<{ id: string }>(
        `insert into public.categories (organization_id, name, created_by)
         values ($1, 'Outerwear', $2) returning id`,
        [organizationA, OWNER_A],
      )
    ).rows[0]!.id;
    const productA = (
      await database.query<{ id: string }>(
        `insert into public.products (
          organization_id, category_id, name, style_code, created_by
        ) values ($1, $2, 'Recovery Jacket', 'REC-JKT', $3)
        returning id`,
        [organizationA, categoryA, OWNER_A],
      )
    ).rows[0]!.id;
    const skuA = (
      await database.query<{ id: string }>(
        `insert into public.skus (
          organization_id, product_id, sku_code, approved_unit_cost,
          currency_code, created_by
        ) values ($1, $2, 'REC-JKT-BLK-M', 100, 'NGN', $3)
        returning id`,
        [organizationA, productA, OWNER_A],
      )
    ).rows[0]!.id;
    uploadA = (
      await database.query<{ id: string }>(
        `insert into public.data_uploads (
          organization_id, upload_type, file_name, row_count, status, created_by
        ) values ($1, 'sample', 'tenant-a-sample.csv', 1, 'ready', $2)
        returning id`,
        [organizationA, OWNER_A],
      )
    ).rows[0]!.id;
    const rawA = (
      await database.query<{ id: string }>(
        `insert into public.raw_upload_rows (
          organization_id, upload_id, row_number, payload
        ) values ($1, $2, 1, '{"sku_code":"REC-JKT-BLK-M"}')
        returning id`,
        [organizationA, uploadA],
      )
    ).rows[0]!.id;
    await database.query(
      `insert into public.staging_inventory_rows (
        organization_id, upload_id, raw_row_id, location_id, sku_code,
        on_hand_quantity, approved_unit_cost, currency_code, validation_status
      ) values ($1, $2, $3, $4, 'REC-JKT-BLK-M', 8, 100, 'NGN', 'valid')`,
      [organizationA, uploadA, rawA, locationA1],
    );
    await database.exec("reset role");
    const snapshotA = (
      await database.query<{ id: string }>(
        `insert into public.inventory_snapshots (
          organization_id, upload_id, observed_at, created_by
        ) values ($1, $2, now(), $3)
        returning id`,
        [organizationA, uploadA, OWNER_A],
      )
    ).rows[0]!.id;
    await database.query(
      `insert into public.inventory_positions (
        organization_id, snapshot_id, sku_id, location_id, on_hand_quantity,
        approved_unit_cost, currency_code, first_available_at
      ) values
        ($1, $2, $3, $4, 8, 100, 'NGN', current_date - 120),
        ($1, $2, $3, $5, 4, 100, 'NGN', current_date - 40)`,
      [organizationA, snapshotA, skuA, locationA1, locationA2],
    );
    await database.query(
      `insert into public.sales_facts (
        organization_id, upload_id, sku_id, location_id, sold_at, quantity,
        gross_amount, currency_code, source_record_key
      ) values
        ($1, $2, $3, $4, now() - interval '10 days', 1, 150, 'NGN', 'sale-a1'),
        ($1, $2, $3, $5, now() - interval '20 days', 1, 150, 'NGN', 'sale-a2')`,
      [organizationA, uploadA, skuA, locationA1, locationA2],
    );

    await authenticate(OWNER_B);
    locationB1 = (
      await database.query<{ id: string }>(
        `insert into public.locations (
          organization_id, name, code, timezone, created_by
        ) values ($1, 'Accra', 'accra-data', 'Africa/Accra', $2)
        returning id`,
        [organizationB, OWNER_B],
      )
    ).rows[0]!.id;
    uploadB = (
      await database.query<{ id: string }>(
        `insert into public.data_uploads (
          organization_id, upload_type, file_name, row_count, status, created_by
        ) values ($1, 'sample', 'tenant-b-sample.csv', 0, 'ready', $2)
        returning id`,
        [organizationB, OWNER_B],
      )
    ).rows[0]!.id;
  }, 30_000);

  afterAll(async () => {
    await database.close();
  });

  it("keeps tenant data and upload lineage isolated", async () => {
    await authenticate(OWNER_A);
    const uploads = await database.query<{ id: string }>(
      "select id from public.data_uploads",
    );

    expect(uploads.rows).toEqual([{ id: uploadA }]);
    expect(uploads.rows).not.toContainEqual({ id: uploadB });
  });

  it("limits store inventory and sales reads to assigned locations", async () => {
    await authenticate(STORE_A);
    const positions = await database.query<{ location_id: string }>(
      "select location_id from public.inventory_positions",
    );
    const sales = await database.query<{ location_id: string }>(
      "select location_id from public.sales_facts",
    );
    const rawRows = await database.query<{ id: string }>(
      "select id from public.raw_upload_rows",
    );

    expect(positions.rows).toEqual([{ location_id: locationA1 }]);
    expect(sales.rows).toEqual([{ location_id: locationA1 }]);
    expect(rawRows.rows).toEqual([]);
    expect(positions.rows).not.toContainEqual({ location_id: locationA2 });
    expect(positions.rows).not.toContainEqual({ location_id: locationB1 });
  });

  it("allows viewer reads but denies data mutation", async () => {
    await authenticate(VIEWER_A);
    const uploads = await database.query<{ id: string }>(
      "select id from public.data_uploads",
    );
    expect(uploads.rows).toEqual([{ id: uploadA }]);

    await expect(
      database.query(
        `insert into public.data_uploads (
          organization_id, upload_type, file_name, created_by
        ) values ($1, 'sample', 'forbidden.csv', $2)`,
        [organizationA, VIEWER_A],
      ),
    ).rejects.toThrow();
  });

  it("enforces composite tenant lineage and immutable tenant keys", async () => {
    await database.exec("reset role");
    await expect(
      database.query(
        `insert into public.raw_upload_rows (
          organization_id, upload_id, row_number, payload
        ) values ($1, $2, 99, '{}')`,
        [organizationA, uploadB],
      ),
    ).rejects.toThrow();

    await authenticate(OWNER_A);
    await expect(
      database.query(
        "update public.data_uploads set organization_id = $1 where id = $2",
        [organizationB, uploadA],
      ),
    ).rejects.toThrow();
  });

  it("denies anonymous access", async () => {
    await database.exec("reset role");
    await database.exec("set role anon");
    await expect(
      database.query("select id from public.data_uploads"),
    ).rejects.toThrow();
  });
});
