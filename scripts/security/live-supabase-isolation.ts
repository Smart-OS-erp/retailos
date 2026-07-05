const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

const root = path.resolve(__dirname, "../..");
const envPath = path.join(root, ".env.local");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error(
    "Live Supabase isolation test blocked: configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in ignored .env.local.",
  );
  process.exit(1);
}

const authOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};

const admin = createClient(supabaseUrl, serviceRoleKey, authOptions);
const runId = randomUUID().replaceAll("-", "").slice(0, 16);
const password = `R0s-${randomUUID()}!`;
const createdUserIds = [];
const createdOrganizationIds = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createConfirmedUser(label) {
  const email = `security-${label}-${runId}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Could not create ${label} test identity: ${error?.message ?? "missing user"}`);
  }

  createdUserIds.push(data.user.id);
  return { email, id: data.user.id };
}

async function authenticatedClient(identity) {
  const client = createClient(supabaseUrl, anonKey, authOptions);
  const { error } = await client.auth.signInWithPassword({
    email: identity.email,
    password,
  });
  if (error) throw new Error(`Could not authenticate synthetic test identity: ${error.message}`);
  return client;
}

async function createOrganization(client, name, slug) {
  const { data, error } = await client.rpc("create_organization", {
    organization_name: name,
    organization_slug: slug,
  });
  if (error || !data) {
    throw new Error(`Organization onboarding failed: ${error?.message ?? "missing organization id"}`);
  }
  createdOrganizationIds.push(data);
  return data;
}

async function cleanup() {
  const cleanupErrors = [];

  if (createdOrganizationIds.length) {
    for (const table of ["audit_events", "memberships"]) {
      const { error } = await admin.from(table).delete().in("organization_id", createdOrganizationIds);
      if (error) cleanupErrors.push(`${table}: ${error.message}`);
    }

    const { error: organizationError } = await admin
      .from("organizations")
      .delete()
      .in("id", createdOrganizationIds);
    if (organizationError) cleanupErrors.push(`organizations: ${organizationError.message}`);
  }

  for (const userId of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) cleanupErrors.push(`auth user: ${error.message}`);
  }

  return cleanupErrors;
}

async function run() {
  const ownerA = await createConfirmedUser("owner-a");
  const ownerB = await createConfirmedUser("owner-b");
  const viewerA = await createConfirmedUser("viewer-a");
  const ownerAClient = await authenticatedClient(ownerA);
  const ownerBClient = await authenticatedClient(ownerB);
  const viewerAClient = await authenticatedClient(viewerA);

  const organizationA = await createOrganization(
    ownerAClient,
    "RetailOS Security Tenant A",
    `security-a-${runId}`,
  );
  const organizationB = await createOrganization(
    ownerBClient,
    "RetailOS Security Tenant B",
    `security-b-${runId}`,
  );

  const { error: fixtureError } = await admin.from("memberships").insert({
    organization_id: organizationA,
    user_id: viewerA.id,
    role: "viewer",
    status: "active",
    created_by: ownerA.id,
  });
  if (fixtureError) throw new Error(`Could not create viewer fixture: ${fixtureError.message}`);

  const { data: ownerAOrganizations, error: ownerAOrganizationsError } = await ownerAClient
    .from("organizations")
    .select("id");
  assert(!ownerAOrganizationsError, `Owner A organization query failed: ${ownerAOrganizationsError?.message}`);
  assert(ownerAOrganizations.length === 1 && ownerAOrganizations[0].id === organizationA, "Owner A organization scope leaked or omitted its tenant");

  const { data: crossTenantOrganization, error: crossTenantError } = await ownerAClient
    .from("organizations")
    .select("id")
    .eq("id", organizationB);
  assert(!crossTenantError, `Cross-tenant read produced an unexpected API error: ${crossTenantError?.message}`);
  assert(crossTenantOrganization.length === 0, "Owner A could read Tenant B");

  const { data: ownerAMemberships, error: ownerAMembershipsError } = await ownerAClient
    .from("memberships")
    .select("organization_id,user_id,role");
  assert(!ownerAMembershipsError, `Owner A membership query failed: ${ownerAMembershipsError?.message}`);
  assert(ownerAMemberships.length === 2, "Owner A did not receive the expected organization membership set");
  assert(ownerAMemberships.every((row) => row.organization_id === organizationA), "Owner A membership query crossed tenant scope");

  const { data: viewerOrganizations, error: viewerOrganizationsError } = await viewerAClient
    .from("organizations")
    .select("id");
  assert(!viewerOrganizationsError, `Viewer organization query failed: ${viewerOrganizationsError?.message}`);
  assert(viewerOrganizations.length === 1 && viewerOrganizations[0].id === organizationA, "Viewer organization scope is incorrect");

  const { data: viewerMemberships, error: viewerMembershipsError } = await viewerAClient
    .from("memberships")
    .select("organization_id,user_id,role");
  assert(!viewerMembershipsError, `Viewer membership query failed: ${viewerMembershipsError?.message}`);
  assert(
    viewerMemberships.length === 1
      && viewerMemberships[0].organization_id === organizationA
      && viewerMemberships[0].user_id === viewerA.id,
    "Viewer could read another user's membership",
  );

  const { data: ownerAAudit, error: ownerAAuditError } = await ownerAClient
    .from("audit_events")
    .select("organization_id,action");
  assert(!ownerAAuditError, `Owner audit query failed: ${ownerAAuditError?.message}`);
  assert(ownerAAudit.length === 1 && ownerAAudit[0].organization_id === organizationA, "Owner audit scope is incorrect");

  const { data: viewerAudit, error: viewerAuditError } = await viewerAClient
    .from("audit_events")
    .select("organization_id");
  assert(!viewerAuditError, `Viewer audit query failed unexpectedly: ${viewerAuditError?.message}`);
  assert(viewerAudit.length === 0, "Viewer could read protected audit events");

  const { error: membershipInsertError } = await viewerAClient.from("memberships").insert({
    organization_id: organizationA,
    user_id: ownerB.id,
    role: "org_owner",
    status: "active",
    created_by: viewerA.id,
  });
  assert(membershipInsertError, "Viewer could insert or elevate a membership");

  const anonymous = createClient(supabaseUrl, anonKey, authOptions);
  const { error: anonymousReadError } = await anonymous.from("organizations").select("id");
  assert(anonymousReadError, "Anonymous caller could query tenant organizations");

  console.log("Live Supabase Auth, onboarding, audit, RBAC, and two-tenant RLS verification passed.");
}

run()
  .catch((error) => {
    console.error(`Live Supabase isolation verification failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const cleanupErrors = await cleanup();
    if (cleanupErrors.length) {
      console.error(`Live-test cleanup requires attention: ${cleanupErrors.join("; ")}`);
      process.exitCode = 1;
    }
  });
