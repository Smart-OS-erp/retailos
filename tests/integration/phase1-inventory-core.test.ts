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

  it("approves, executes, idempotently retries, and reverses stock adjustments", async () => {
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
    const movementBeforeExecution = await database.query<{ count: string }>(
      `select count(*)::text
       from public.inventory_movements
       where source_id = $1`,
      [adjustmentId],
    );

    expect(approvedId).toBe(adjustmentId);
    expect(movementBeforeExecution.rows[0]!.count).toBe("0");

    await database.query(
      "select public.execute_stock_adjustment($1, $2)",
      [adjustmentId, "adjustment-execute-test"],
    );
    await database.query(
      "select public.execute_stock_adjustment($1, $2)",
      [adjustmentId, "adjustment-execute-test"],
    );

    const movement = await database.query<{
      movement_type: string;
      quantity_after: number;
      quantity_before: number;
      quantity_delta: number;
      source_type: string;
    }>(
      `select movement_type, source_type, quantity_delta, quantity_before, quantity_after
       from public.inventory_movements
       where source_id = $1`,
      [adjustmentId],
    );
    expect(movement.rows).toEqual([
      {
        movement_type: "adjustment",
        quantity_after: 10,
        quantity_before: 12,
        quantity_delta: -2,
        source_type: "stock_adjustment",
      },
    ]);

    const executedBalance = await database.query<{ on_hand_quantity: number }>(
      `select on_hand_quantity
       from public.current_inventory_balances
       where organization_id = $1 and sku_id = $2 and location_id = $3`,
      [organizationA, skuA, locationA1],
    );
    expect(executedBalance.rows[0]!.on_hand_quantity).toBe(10);

    await database.query(
      "select public.reverse_stock_adjustment($1, $2, $3)",
      [adjustmentId, "Reverse test correction", "adjustment-reverse-test"],
    );

    const reversed = await database.query<{
      movement_count: string;
      net_delta: number;
      status: string;
    }>(
      `select
        (select count(*)::text from public.inventory_movements where source_id = $1) as movement_count,
        (select coalesce(sum(quantity_delta), 0)::integer from public.inventory_movements where source_id = $1) as net_delta,
        (select status from public.stock_adjustments where id = $1) as status`,
      [adjustmentId],
    );
    expect(reversed.rows[0]).toEqual({
      movement_count: "2",
      net_delta: 0,
      status: "reversed",
    });
  });

  it("approves, dispatches, partially receives, and reconciles transfers", async () => {
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
    const movementsBeforeDispatch = await database.query<{ count: string }>(
      `select count(*)::text
       from public.inventory_movements
       where source_id = $1`,
      [transferId],
    );
    const reservedBalance = await database.query<{
      available_quantity: number;
      reserved_quantity: number;
    }>(
      `select reserved_quantity, available_quantity
       from public.current_inventory_balances
       where organization_id = $1 and sku_id = $2 and location_id = $3`,
      [organizationA, skuA, locationA1],
    );

    expect(movementsBeforeDispatch.rows[0]!.count).toBe("0");
    expect(reservedBalance.rows[0]).toEqual({
      available_quantity: 9,
      reserved_quantity: 3,
    });

    await database.query("select public.dispatch_transfer_request($1, $2)", [
      transferId,
      "transfer-dispatch-test",
    ]);
    await database.query("select public.dispatch_transfer_request($1, $2)", [
      transferId,
      "transfer-dispatch-test",
    ]);

    const transferItem = (
      await database.query<{ id: string }>(
        `select id
         from public.transfer_items
         where transfer_request_id = $1`,
        [transferId],
      )
    ).rows[0]!;
    const movements = await database.query<{
      location_id: string;
      movement_type: string;
      quantity_after: number;
      quantity_before: number;
      quantity_delta: number;
    }>(
      `select location_id, movement_type, quantity_delta, quantity_before, quantity_after
       from public.inventory_movements
       where source_id = $1
       order by quantity_delta`,
      [transferId],
    );

    expect(movements.rows).toEqual([
      {
        location_id: locationA1,
        movement_type: "transfer_out",
        quantity_after: 9,
        quantity_before: 12,
        quantity_delta: -3,
      },
    ]);

    const inTransitBalance = await database.query<{
      in_transit_quantity: number;
      on_hand_quantity: number;
    }>(
      `select on_hand_quantity, in_transit_quantity
       from public.current_inventory_balances
       where organization_id = $1 and sku_id = $2 and location_id = $3`,
      [organizationA, skuA, locationA2],
    );
    expect(inTransitBalance.rows[0]).toEqual({
      in_transit_quantity: 3,
      on_hand_quantity: 4,
    });

    await database.query(
      "select public.receive_transfer_request($1, $2::jsonb, $3)",
      [
        transferId,
        JSON.stringify([
          { transfer_item_id: transferItem.id, received_quantity: 1 },
        ]),
        "transfer-receive-partial",
      ],
    );

    const partial = await database.query<{
      discrepancy_status: string;
      in_transit_quantity: number;
      on_hand_quantity: number;
      status: string;
      variance_quantity: number;
    }>(
      `select
        balance.on_hand_quantity,
        balance.in_transit_quantity,
        request.status,
        discrepancy.status as discrepancy_status,
        discrepancy.variance_quantity
       from public.current_inventory_balances balance
       join public.transfer_requests request
         on request.organization_id = balance.organization_id
        and request.id = $4
       join public.transfer_discrepancies discrepancy
         on discrepancy.organization_id = request.organization_id
        and discrepancy.transfer_request_id = request.id
       where balance.organization_id = $1 and balance.sku_id = $2 and balance.location_id = $3
         and discrepancy.discrepancy_type = 'short_receipt'`,
      [organizationA, skuA, locationA2, transferId],
    );
    expect(partial.rows[0]).toEqual({
      discrepancy_status: "open",
      in_transit_quantity: 2,
      on_hand_quantity: 5,
      status: "partially_received",
      variance_quantity: -2,
    });

    await database.query(
      "select public.receive_transfer_request($1, $2::jsonb, $3)",
      [
        transferId,
        JSON.stringify([
          { transfer_item_id: transferItem.id, received_quantity: 2 },
        ]),
        "transfer-receive-final",
      ],
    );

    const received = await database.query<{
      discrepancy_status: string;
      in_transit_quantity: number;
      on_hand_quantity: number;
      status: string;
    }>(
      `select
        balance.on_hand_quantity,
        balance.in_transit_quantity,
        request.status,
        discrepancy.status as discrepancy_status
       from public.current_inventory_balances balance
       join public.transfer_requests request
         on request.organization_id = balance.organization_id
        and request.id = $4
       join public.transfer_discrepancies discrepancy
         on discrepancy.organization_id = request.organization_id
        and discrepancy.transfer_request_id = request.id
       where balance.organization_id = $1 and balance.sku_id = $2 and balance.location_id = $3
         and discrepancy.discrepancy_type = 'short_receipt'`,
      [organizationA, skuA, locationA2, transferId],
    );
    expect(received.rows[0]).toEqual({
      discrepancy_status: "resolved",
      in_transit_quantity: 0,
      on_hand_quantity: 7,
      status: "received",
    });

    const allMovements = await database.query<{
      location_id: string;
      movement_type: string;
      quantity_delta: number;
    }>(
      `select location_id, movement_type, quantity_delta
       from public.inventory_movements
       where source_id = $1
       order by quantity_delta, created_at`,
      [transferId],
    );
    expect(allMovements.rows).toEqual([
      {
        location_id: locationA1,
        movement_type: "transfer_out",
        quantity_delta: -3,
      },
      {
        location_id: locationA2,
        movement_type: "transfer_in",
        quantity_delta: 1,
      },
      {
        location_id: locationA2,
        movement_type: "transfer_in",
        quantity_delta: 2,
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

  it("reviews and closes stock counts with idempotent correction movements", async () => {
    await authenticate(OWNER_A);
    const current = (
      await database.query<{ on_hand_quantity: number }>(
        `select on_hand_quantity
         from public.current_inventory_balances
         where organization_id = $1 and sku_id = $2 and location_id = $3`,
        [organizationA, skuA, locationA1],
      )
    ).rows[0]!.on_hand_quantity;
    const countId = (
      await database.query<{ id: string }>(
        "select public.submit_stock_count($1, timezone('utc', now()), $2::jsonb) as id",
        [
          locationA1,
          JSON.stringify([
            {
              counted_quantity: current + 2,
              expected_quantity: current,
              sku_id: skuA,
            },
          ]),
        ],
      )
    ).rows[0]!.id;
    const issueId = (
      await database.query<{ id: string }>(
        `select id
         from public.reconciliation_issues
         where stock_count_id = $1`,
        [countId],
      )
    ).rows[0]!.id;

    await database.query("select public.review_stock_count($1, $2)", [
      countId,
      "Reviewed against physical count sheet",
    ]);
    await database.query(
      "select public.close_stock_count($1, $2::jsonb, true, $3, $4)",
      [
        countId,
        JSON.stringify([
          {
            issue_id: issueId,
            resolution_note: "Count verified by manager",
            status: "resolved",
          },
        ]),
        "stock-count-close-test",
        "Closed with correction",
      ],
    );
    await database.query(
      "select public.close_stock_count($1, $2::jsonb, true, $3, $4)",
      [countId, JSON.stringify([]), "stock-count-close-test", "Retry"],
    );

    const closed = await database.query<{
      movement_count: string;
      on_hand_quantity: number;
      issue_status: string;
      status: string;
    }>(
      `select
        (select status from public.stock_counts where id = $1) as status,
        (select status from public.reconciliation_issues where id = $2) as issue_status,
        (select count(*)::text from public.inventory_movements where source_id = $1 and movement_type = 'count_correction') as movement_count,
        (select on_hand_quantity from public.current_inventory_balances where organization_id = $3 and sku_id = $4 and location_id = $5) as on_hand_quantity`,
      [countId, issueId, organizationA, skuA, locationA1],
    );

    expect(closed.rows[0]).toEqual({
      issue_status: "resolved",
      movement_count: "1",
      on_hand_quantity: current + 2,
      status: "closed",
    });
  });

  it("derives low and out-of-stock watchlist signals from persisted balances", async () => {
    await authenticate(OWNER_A);
    const current = (
      await database.query<{ on_hand_quantity: number }>(
        `select on_hand_quantity
         from public.current_inventory_balances
         where organization_id = $1 and sku_id = $2 and location_id = $3`,
        [organizationA, skuA, locationA2],
      )
    ).rows[0]!.on_hand_quantity;
    const adjustmentId = (
      await database.query<{ id: string }>(
        "select public.create_stock_adjustment($1, $2, $3::jsonb) as id",
        [
          locationA2,
          "Reduce to zero for watchlist test",
          JSON.stringify([{ quantity_delta: -current, sku_id: skuA }]),
        ],
      )
    ).rows[0]!.id;
    await database.query("select public.approve_stock_adjustment($1)", [
      adjustmentId,
    ]);
    await database.query("select public.execute_stock_adjustment($1, $2)", [
      adjustmentId,
      "watchlist-adjustment-test",
    ]);

    const watchlist = await database.query<{
      severity: string;
      watch_status: string;
    }>(
      `select severity, watch_status
       from public.inventory_stock_watchlist
       where organization_id = $1 and sku_id = $2 and location_id = $3`,
      [organizationA, skuA, locationA2],
    );

    expect(watchlist.rows[0]).toEqual({
      severity: "high",
      watch_status: "out_of_stock",
    });
  });

  it("adds, updates, and removes saved watchlist items without cross-role mutation", async () => {
    await authenticate(OWNER_A);
    const watchlistId = (
      await database.query<{ id: string }>(
        "select public.add_inventory_watchlist_item($1, $2, $3, $4) as id",
        [locationA1, skuA, "manual", "Owner follow-up"],
      )
    ).rows[0]!.id;
    const duplicateId = (
      await database.query<{ id: string }>(
        "select public.add_inventory_watchlist_item($1, $2, $3, $4) as id",
        [locationA1, skuA, "low_stock", "Updated owner follow-up"],
      )
    ).rows[0]!.id;

    expect(duplicateId).toBe(watchlistId);

    const saved = await database.query<{
      active_count: string;
      note: string;
      watch_status: string;
    }>(
      `select
        count(*)::text as active_count,
        max(note) as note,
        max(watch_status) as watch_status
       from public.inventory_saved_watchlist
       where organization_id = $1 and location_id = $2 and sku_id = $3`,
      [organizationA, locationA1, skuA],
    );

    expect(saved.rows[0]).toEqual({
      active_count: "1",
      note: "Updated owner follow-up",
      watch_status: "low_stock",
    });

    await authenticate(VIEWER_A);
    await expect(
      database.query(
        "select public.add_inventory_watchlist_item($1, $2, $3, $4)",
        [locationA1, skuA, "manual", "Viewer should fail"],
      ),
    ).rejects.toThrow(/permission_denied/);

    await authenticate(STORE_A);
    await expect(
      database.query(
        "select public.add_inventory_watchlist_item($1, $2, $3, $4)",
        [locationA2, skuA, "manual", "Unassigned location should fail"],
      ),
    ).rejects.toThrow(/permission_denied/);

    await authenticate(OWNER_A);
    await database.query("select public.remove_inventory_watchlist_item($1)", [
      watchlistId,
    ]);

    const removed = await database.query<{ active_count: string }>(
      `select count(*)::text as active_count
       from public.inventory_saved_watchlist
       where organization_id = $1 and id = $2`,
      [organizationA, watchlistId],
    );

    expect(removed.rows[0]!.active_count).toBe("0");
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
