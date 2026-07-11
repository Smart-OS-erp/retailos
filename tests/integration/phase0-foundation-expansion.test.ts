import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OWNER_A = "00000000-0000-4000-8000-00000000001a";
const OWNER_B = "00000000-0000-4000-8000-00000000001b";
const STORE_A = "00000000-0000-4000-8000-00000000001c";
const OUTSIDER = "00000000-0000-4000-8000-00000000001d";

describe("Phase 0 foundation expansion RLS", () => {
  const database = new PGlite();
  let organizationA: string;
  let organizationB: string;
  let storeMembershipA: string;
  let locationA1: string;
  let locationA2: string;
  let locationB1: string;

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
        ('${OUTSIDER}');
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
    const resultA = await database.query<{ id: string }>(
      "select public.create_organization($1, $2) as id",
      ["Tenant A", "foundation-tenant-a"],
    );
    organizationA = resultA.rows[0]!.id;

    await authenticate(OWNER_B);
    const resultB = await database.query<{ id: string }>(
      "select public.create_organization($1, $2) as id",
      ["Tenant B", "foundation-tenant-b"],
    );
    organizationB = resultB.rows[0]!.id;

    await database.exec("reset role");
    const storeMembershipResult = await database.query<{ id: string }>(
      `insert into public.memberships (
        organization_id,
        user_id,
        role,
        status,
        created_by
      ) values ($1, $2, 'store_manager', 'active', $3)
      returning id`,
      [organizationA, STORE_A, OWNER_A],
    );
    storeMembershipA = storeMembershipResult.rows[0]!.id;

    await authenticate(OWNER_A);
    const firstLocation = await database.query<{ id: string }>(
      `insert into public.locations (
        organization_id, name, code, timezone, created_by
      ) values ($1, 'Lagos Flagship', 'lagos', 'Africa/Lagos', $2)
      returning id`,
      [organizationA, OWNER_A],
    );
    locationA1 = firstLocation.rows[0]!.id;

    const secondLocation = await database.query<{ id: string }>(
      `insert into public.locations (
        organization_id, name, code, timezone, created_by
      ) values ($1, 'Abuja Store', 'abuja', 'Africa/Lagos', $2)
      returning id`,
      [organizationA, OWNER_A],
    );
    locationA2 = secondLocation.rows[0]!.id;

    await database.query(
      `insert into public.location_assignments (
        organization_id, location_id, membership_id, created_by
      ) values ($1, $2, $3, $4)`,
      [organizationA, locationA1, storeMembershipA, OWNER_A],
    );

    await database.query(
      `insert into public.brands (organization_id, name, code, created_by)
       values ($1, 'Tenant A Brand', 'tenant-a-brand', $2)`,
      [organizationA, OWNER_A],
    );

    await authenticate(OWNER_B);
    const otherTenantLocation = await database.query<{ id: string }>(
      `insert into public.locations (
        organization_id, name, code, timezone, created_by
      ) values ($1, 'Accra Store', 'accra', 'Africa/Accra', $2)
      returning id`,
      [organizationB, OWNER_B],
    );
    locationB1 = otherTenantLocation.rows[0]!.id;

    await database.query(
      `insert into public.brands (organization_id, name, code, created_by)
       values ($1, 'Tenant B Brand', 'tenant-b-brand', $2)`,
      [organizationB, OWNER_B],
    );
  }, 30_000);

  afterAll(async () => {
    await database.close();
  });

  it("keeps tenant-neutral profiles private to the authenticated user", async () => {
    await authenticate(OWNER_A);

    const profiles = await database.query<{ id: string }>(
      "select id from public.app_users",
    );
    const crossUserUpdate = await database.query<{ id: string }>(
      `update public.app_users
       set display_name = 'Not Allowed'
       where id = $1
       returning id`,
      [OWNER_B],
    );

    expect(profiles.rows).toEqual([{ id: OWNER_A }]);
    expect(crossUserUpdate.rows).toEqual([]);
  });

  it("limits store managers to explicitly assigned locations", async () => {
    await authenticate(STORE_A);

    const locations = await database.query<{ id: string }>(
      "select id from public.locations order by id",
    );
    const assignments = await database.query<{
      location_id: string;
      membership_id: string;
    }>("select location_id, membership_id from public.location_assignments");

    expect(locations.rows).toEqual([{ id: locationA1 }]);
    expect(locations.rows).not.toContainEqual({ id: locationA2 });
    expect(locations.rows).not.toContainEqual({ id: locationB1 });
    expect(assignments.rows).toEqual([
      { location_id: locationA1, membership_id: storeMembershipA },
    ]);
  });

  it("allows tenant-wide owner reads without crossing tenants", async () => {
    await authenticate(OWNER_A);

    const locations = await database.query<{ id: string }>(
      "select id from public.locations order by id",
    );
    const brands = await database.query<{ organization_id: string }>(
      "select organization_id from public.brands",
    );

    expect(locations.rows.map((row) => row.id).sort()).toEqual(
      [locationA1, locationA2].sort(),
    );
    expect(brands.rows).toEqual([{ organization_id: organizationA }]);
  });

  it("denies cross-tenant and unprivileged writes", async () => {
    await authenticate(STORE_A);

    await expect(
      database.query(
        `insert into public.locations (
          organization_id, name, code, timezone, created_by
        ) values ($1, 'Unauthorized', 'unauthorized', 'Africa/Lagos', $2)`,
        [organizationA, STORE_A],
      ),
    ).rejects.toThrow();

    await database.exec("reset role");
    await expect(
      database.query(
        `insert into public.location_assignments (
          organization_id, location_id, membership_id, created_by
        ) values ($1, $2, $3, $4)`,
        [organizationA, locationB1, storeMembershipA, OWNER_A],
      ),
    ).rejects.toThrow();
  });

  it("seeds resumable owner onboarding and audits controlled transitions", async () => {
    await authenticate(OWNER_A);

    const checklistBefore = await database.query<{
      step: string;
      status: string;
    }>(
      "select step, status from public.onboarding_checklists order by step",
    );
    expect(checklistBefore.rows).toHaveLength(5);
    expect(checklistBefore.rows.every((row) => row.status === "not_started")).toBe(
      true,
    );

    await database.query(
      "select public.set_onboarding_step($1, 'company_profile', 'completed')",
      [organizationA],
    );

    const completedStep = await database.query<{
      completed_by: string;
      status: string;
    }>(
      `select completed_by, status
       from public.onboarding_checklists
       where organization_id = $1 and step = 'company_profile'`,
      [organizationA],
    );
    const audit = await database.query<{ action: string }>(
      `select action from public.audit_events
       where organization_id = $1 and action = 'onboarding.step_status_changed'`,
      [organizationA],
    );

    expect(completedStep.rows).toEqual([
      { completed_by: OWNER_A, status: "completed" },
    ]);
    expect(audit.rows).toEqual([
      { action: "onboarding.step_status_changed" },
    ]);

    await authenticate(OWNER_B);
    await expect(
      database.query(
        "select public.set_onboarding_step($1, 'company_profile', 'completed')",
        [organizationA],
      ),
    ).rejects.toThrow(/permission_denied/);
  });

  it("keeps the operational event log tenant-scoped and append-only", async () => {
    await authenticate(OWNER_A);

    const events = await database.query<{ organization_id: string }>(
      "select organization_id from public.event_log",
    );
    expect(events.rows.length).toBeGreaterThan(0);
    expect(events.rows.every((row) => row.organization_id === organizationA)).toBe(
      true,
    );

    await expect(
      database.query(
        `insert into public.event_log (
          organization_id, scope, event_type, aggregate_type
        ) values ($1, 'organization', 'client.forbidden', 'client')`,
        [organizationA],
      ),
    ).rejects.toThrow();

    await expect(
      database.query(
        "update public.event_log set delivery_attempts = 99",
      ),
    ).rejects.toThrow();
  });

  it("fails closed for anonymous, suspended, and no-membership users", async () => {
    await database.exec("reset role");
    await database.query(
      `update public.memberships
       set status = 'suspended'
       where organization_id = $1 and user_id = $2`,
      [organizationA, STORE_A],
    );

    await authenticate(STORE_A);
    const suspendedLocations = await database.query<{ id: string }>(
      "select id from public.locations",
    );
    expect(suspendedLocations.rows).toEqual([]);

    await authenticate(OUTSIDER);
    const outsiderBrands = await database.query<{ id: string }>(
      "select id from public.brands",
    );
    expect(outsiderBrands.rows).toEqual([]);

    await database.exec("reset role");
    await database.exec("set role anon");
    await expect(database.query("select id from public.locations")).rejects.toThrow();
    await expect(database.query("select id from public.app_users")).rejects.toThrow();
  });
});
