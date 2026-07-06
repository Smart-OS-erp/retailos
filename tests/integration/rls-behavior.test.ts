import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const USER_A = "00000000-0000-4000-8000-00000000000a";
const USER_B = "00000000-0000-4000-8000-00000000000b";
const USER_C = "00000000-0000-4000-8000-00000000000c";
const USER_D = "00000000-0000-4000-8000-00000000000d";

describe("tenant RLS behavior", () => {
  const database = new PGlite();
  let organizationA: string;
  let organizationB: string;

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
        ('${USER_A}'),
        ('${USER_B}'),
        ('${USER_C}'),
        ('${USER_D}');
    `);

    const migrationPath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "20260705113000_secure_technical_foundation.sql",
    );
    const migration = (await readFile(migrationPath, "utf8")).replace(
      "create extension if not exists pgcrypto with schema extensions;",
      "-- gen_random_uuid() is built into the PGlite PostgreSQL test engine.",
    );
    await database.exec(migration);

    await authenticate(USER_A);
    const resultA = await database.query<{ id: string }>(
      "select public.create_organization($1, $2) as id",
      ["Tenant A", "tenant-a"],
    );
    organizationA = resultA.rows[0]!.id;

    await authenticate(USER_B);
    const resultB = await database.query<{ id: string }>(
      "select public.create_organization($1, $2) as id",
      ["Tenant B", "tenant-b"],
    );
    organizationB = resultB.rows[0]!.id;

    await database.exec("reset role");
    await database.query(
      `insert into public.memberships (
        organization_id,
        user_id,
        role,
        status,
        created_by
      ) values ($1, $2, 'viewer', 'active', $3)`,
      [organizationA, USER_C, USER_A],
    );
  }, 30_000);

  afterAll(async () => {
    await database.close();
  });

  it("returns only the caller's organization and audit event", async () => {
    await authenticate(USER_A);

    const organizations = await database.query<{ id: string }>(
      "select id from public.organizations order by id",
    );
    const audits = await database.query<{ organization_id: string }>(
      "select organization_id from public.audit_events",
    );

    expect(organizations.rows).toEqual([{ id: organizationA }]);
    expect(audits.rows).toEqual([{ organization_id: organizationA }]);
    expect(organizations.rows).not.toContainEqual({ id: organizationB });
  });

  it("allows an owner to update only its own organization", async () => {
    await authenticate(USER_A);

    const ownUpdate = await database.query<{ id: string }>(
      "update public.organizations set name = 'Tenant A Updated' where id = $1 returning id",
      [organizationA],
    );
    const crossTenantUpdate = await database.query<{ id: string }>(
      "update public.organizations set name = 'Blocked' where id = $1 returning id",
      [organizationB],
    );

    expect(ownUpdate.rows).toEqual([{ id: organizationA }]);
    expect(crossTenantUpdate.rows).toEqual([]);
  });

  it("denies direct membership writes and repeat onboarding", async () => {
    await authenticate(USER_A);

    await expect(
      database.query(
        `insert into public.memberships (
          organization_id,
          user_id,
          role,
          status,
          created_by
        ) values ($1, $2, 'viewer', 'active', $2)`,
        [organizationA, USER_B],
      ),
    ).rejects.toThrow();

    await expect(
      database.query(
        "select public.create_organization($1, $2)",
        ["Another Tenant", "another-tenant"],
      ),
    ).rejects.toThrow(/onboarding_already_completed/);
  });

  it("denies table access to the anonymous role", async () => {
    await database.exec("reset role");
    await database.exec("set role anon");

    await expect(
      database.query("select id from public.organizations"),
    ).rejects.toThrow();
  });

  it("allows a viewer to see the organization but not its audit or member roster", async () => {
    await authenticate(USER_C);

    const organizations = await database.query<{ id: string }>(
      "select id from public.organizations",
    );
    const audits = await database.query<{ id: string }>(
      "select id from public.audit_events",
    );
    const memberships = await database.query<{ user_id: string }>(
      "select user_id from public.memberships",
    );

    expect(organizations.rows).toEqual([{ id: organizationA }]);
    expect(audits.rows).toEqual([]);
    expect(memberships.rows).toEqual([{ user_id: USER_C }]);
  });

  it("fails closed for suspended and no-membership users", async () => {
    await database.exec("reset role");
    await database.query(
      "update public.memberships set status = 'suspended' where organization_id = $1 and user_id = $2",
      [organizationA, USER_C],
    );

    await authenticate(USER_C);
    const suspendedRows = await database.query<{ id: string }>(
      "select id from public.organizations",
    );
    expect(suspendedRows.rows).toEqual([]);

    await authenticate(USER_D);
    const noMembershipRows = await database.query<{ id: string }>(
      "select id from public.organizations",
    );
    expect(noMembershipRows.rows).toEqual([]);
  });
});
