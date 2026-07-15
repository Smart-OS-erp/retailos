const fs = require("node:fs");
const path = require("node:path");
const { createHmac, randomBytes, randomUUID } = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

const root = process.cwd();

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function loadEnvFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;

      const [, key, rawValue] = match;
      let value = rawValue;
      if (
        (value.startsWith("\"") && value.endsWith("\""))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
    return true;
  }

  return false;
}

loadEnvFile(path.join(root, ".env.local"));

const explicitEnvPath = readArg("--env");
if (explicitEnvPath) {
  const resolvedEnvPath = path.resolve(root, explicitEnvPath);
  if (process.env.SMOKE_DEBUG === "1") {
    console.error(`Smoke debug: root=${root}`);
    console.error(`Smoke debug: env=${resolvedEnvPath}`);
    console.error(`Smoke debug: envExists=${fs.existsSync(resolvedEnvPath)}`);
  }
  loadEnvFile(resolvedEnvPath);
}

const baseUrlInput = readArg("--url") ?? process.env.IMPORT_API_BASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tokenHashSecret = process.env.IMPORT_API_TOKEN_HASH_SECRET;

const missingConfig = [
  ["--url or IMPORT_API_BASE_URL", baseUrlInput],
  ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
  ["IMPORT_API_TOKEN_HASH_SECRET", tokenHashSecret],
]
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length) {
  console.error(
    `Live Import API smoke blocked: missing ${missingConfig.join(", ")}. Provide values through --url and ignored env files.`,
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

function hashImportApiToken(token) {
  return `hmac-sha256:${createHmac("sha256", tokenHashSecret).update(token).digest("hex")}`;
}

function cookieHeaderFrom(headers) {
  const getSetCookie = headers.getSetCookie?.bind(headers);
  const cookies = typeof getSetCookie === "function"
    ? getSetCookie()
    : [headers.get("set-cookie")].filter(Boolean);

  return cookies
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function getVercelBypassCookie(rawUrl) {
  const url = new URL(rawUrl);
  if (!url.searchParams.has("_vercel_share")) return "";

  let nextUrl = url.toString();
  let cookie = "";

  for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
    const response = await fetch(nextUrl, {
      redirect: "manual",
      headers: cookie ? { cookie } : undefined,
    });

    const responseCookie = cookieHeaderFrom(response.headers);
    if (responseCookie) {
      cookie = [cookie, responseCookie].filter(Boolean).join("; ");
    }

    if (response.status < 300 || response.status >= 400) return cookie;

    const location = response.headers.get("location");
    if (!location) return cookie;
    nextUrl = new URL(location, nextUrl).toString();
  }

  return cookie;
}

function baseWithoutShare(rawUrl) {
  const url = new URL(rawUrl);
  url.searchParams.delete("_vercel_share");
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function createConfirmedUser() {
  const email = `import-api-smoke-${runId}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Could not create smoke identity: ${error?.message ?? "missing user"}`);
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
  if (error) throw new Error(`Could not authenticate smoke identity: ${error.message}`);
  return client;
}

async function createOrganization(client) {
  const { data, error } = await client.rpc("create_organization", {
    organization_name: "RetailOS Import API Smoke Tenant",
    organization_slug: `import-api-smoke-${runId}`,
  });

  if (error || !data) {
    throw new Error(`Could not create smoke organization: ${error?.message ?? "missing organization id"}`);
  }

  createdOrganizationIds.push(data);
  return data;
}

async function cleanup() {
  const cleanupErrors = [];

  if (createdOrganizationIds.length) {
    const tenantTables = [
      "external_records",
      "import_api_rate_limit_events",
      "import_api_idempotency_keys",
      "sync_errors",
      "sync_jobs",
      "import_api_credentials",
      "data_sources",
      "audit_events",
      "memberships",
    ];

    for (const table of tenantTables) {
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
  const identity = await createConfirmedUser();
  const client = await authenticatedClient(identity);
  const organizationId = await createOrganization(client);

  const { data: dataSourceId, error: dataSourceError } = await client.rpc(
    "create_data_source",
    {
      target_organization_id: organizationId,
      target_provider_key: "import_api",
      target_name: "Import API smoke source",
    },
  );
  if (dataSourceError || !dataSourceId) {
    throw new Error(`Could not create smoke data source: ${dataSourceError?.message ?? "missing data source id"}`);
  }

  const rawToken = `rtos_${randomBytes(24).toString("hex")}`;
  const tokenPrefix = rawToken.slice(0, 18);
  const tokenHash = hashImportApiToken(rawToken);

  const { data: credentialId, error: credentialError } = await client.rpc(
    "create_import_api_credential",
    {
      target_data_source_id: dataSourceId,
      target_label: "Import API smoke credential",
      target_token_prefix: tokenPrefix,
      target_token_hash: tokenHash,
    },
  );
  if (credentialError || !credentialId) {
    throw new Error(`Could not create smoke Import API credential: ${credentialError?.message ?? "missing credential id"}`);
  }

  const baseUrl = baseWithoutShare(baseUrlInput);
  const cookie = await getVercelBypassCookie(baseUrlInput);
  const idempotencyKey = `smoke-${runId}`;
  const sourceRecordKey = `sku-${runId}`;

  const response = await fetch(`${baseUrl}/api/import/v1/records`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${rawToken}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({
      records: [
        {
          record_type: "product_master",
          source_record_key: sourceRecordKey,
          source_updated_at: new Date().toISOString(),
          location_code: "lag-smoke",
          payload: {
            sku: sourceRecordKey,
            name: "Smoke Test Product",
            brand: "RetailOS",
          },
        },
      ],
    }),
  });

  const responseBody = await response.json().catch(() => ({}));
  assert(response.status === 202, `Import API returned ${response.status}: ${JSON.stringify(responseBody)}`);
  assert(responseBody.status === "accepted", "Import API did not return accepted status");
  assert(responseBody.accepted_records === 1, "Import API did not accept exactly one record");
  assert(responseBody.idempotent_replay === false, "First Import API request was unexpectedly marked as replay");

  const { data: records, error: recordsError } = await admin
    .from("external_records")
    .select("id,organization_id,data_source_id,record_type,source_record_key,status")
    .eq("organization_id", organizationId)
    .eq("data_source_id", dataSourceId)
    .eq("source_record_key", sourceRecordKey);
  if (recordsError) throw new Error(`Could not verify external record: ${recordsError.message}`);
  assert(records.length === 1, "Import API did not persist exactly one external record");
  assert(records[0].status === "received", "External record was not persisted in received status");

  const replay = await fetch(`${baseUrl}/api/import/v1/records`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${rawToken}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({
      records: [
        {
          record_type: "product_master",
          source_record_key: sourceRecordKey,
          source_updated_at: new Date().toISOString(),
          location_code: "lag-smoke",
          payload: {
            sku: sourceRecordKey,
            name: "Smoke Test Product",
            brand: "RetailOS",
          },
        },
      ],
    }),
  });

  const replayBody = await replay.json().catch(() => ({}));
  assert(replay.status === 202, `Import API replay returned ${replay.status}: ${JSON.stringify(replayBody)}`);
  assert(replayBody.idempotent_replay === true, "Duplicate idempotency key was not treated as a replay");

  console.log(
    `Live Import API smoke passed for ${baseUrl}: created tenant-scoped credential, accepted one external record, and verified idempotent replay.`,
  );
}

run()
  .catch((error) => {
    console.error(`Live Import API smoke failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const cleanupErrors = await cleanup();
    if (cleanupErrors.length) {
      console.error(`Live Import API smoke cleanup requires attention: ${cleanupErrors.join("; ")}`);
      process.exitCode = 1;
    }
  });
