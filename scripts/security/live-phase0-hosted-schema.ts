const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const envPath = path.join(root, ".env.local");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  console.error(
    "Live Phase 0 schema verification blocked: configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in ignored .env.local.",
  );
  process.exit(1);
}

const requiredRelations = [
  "organizations",
  "memberships",
  "audit_events",
  "app_users",
  "locations",
  "brands",
  "location_assignments",
  "onboarding_checklists",
  "event_log",
  "entities",
  "categories",
  "products",
  "skus",
  "data_uploads",
  "raw_upload_rows",
  "staging_inventory_rows",
  "validation_issues",
  "inventory_snapshots",
  "inventory_positions",
  "sales_facts",
  "consolidation_runs",
  "consolidation_items",
  "current_inventory_positions",
  "intelligence_runs",
  "inventory_risk_insights",
  "recovery_opportunities",
  "executive_briefings",
  "action_cards",
  "recovery_projects",
  "recovery_project_skus",
  "recovery_project_tasks",
  "campaign_briefs",
  "approval_records",
  "copilot_activity_log",
  "integration_providers",
  "data_sources",
  "external_records",
  "sync_jobs",
  "sync_errors",
  "webhook_events",
  "import_api_credentials",
  "import_api_idempotency_keys",
  "import_api_rate_limit_events",
];

const requiredFunctions = [
  "create_organization",
  "set_onboarding_step",
  "accept_inventory_upload_warnings",
  "consolidate_inventory_upload",
  "run_inventory_recovery_intelligence",
  "create_recovery_project",
  "submit_recovery_project",
  "approve_recovery_project",
  "approve_campaign_brief",
  "set_recovery_task_status",
  "get_retail_copilot_answer",
  "create_data_source",
  "enqueue_data_source_sync",
  "create_import_api_credential",
  "revoke_import_api_credential",
];

function toRestUrl(baseUrl) {
  return new URL("/rest/v1/", baseUrl).toString();
}

async function run() {
  const authAttempts = [
    { label: "anon", key: anonKey },
    serviceRoleKey ? { label: "server-only service role", key: serviceRoleKey } : null,
  ].filter(Boolean);

  let response;
  let authLabel = "unknown";

  for (const attempt of authAttempts) {
    const attemptedResponse = await fetch(toRestUrl(supabaseUrl), {
      headers: {
        accept: "application/openapi+json",
        apikey: attempt.key,
        authorization: `Bearer ${attempt.key}`,
      },
    });

    if (attemptedResponse.ok) {
      response = attemptedResponse;
      authLabel = attempt.label;
      break;
    }

    if (attempt.label === "anon" && attemptedResponse.status !== 401) {
      response = attemptedResponse;
      authLabel = attempt.label;
      break;
    }
  }

  if (!response) {
    throw new Error("REST schema request was not attempted");
  }

  if (!response.ok) {
    throw new Error(
      `REST schema request failed with HTTP ${response.status} using ${authLabel}`,
    );
  }

  const spec = await response.json();
  const paths = new Set(Object.keys(spec.paths ?? {}));
  const missingRelations = requiredRelations.filter(
    (relation) => !paths.has(`/${relation}`),
  );
  const missingFunctions = requiredFunctions.filter(
    (functionName) => !paths.has(`/rpc/${functionName}`),
  );

  if (missingRelations.length || missingFunctions.length) {
    const details = [
      missingRelations.length
        ? `missing relations/views: ${missingRelations.join(", ")}`
        : null,
      missingFunctions.length
        ? `missing RPC endpoints: ${missingFunctions.join(", ")}`
        : null,
    ].filter(Boolean);

    throw new Error(details.join("; "));
  }

  console.log(
    `Live Phase 0/0.5 hosted schema verification passed using ${authLabel} for ${requiredRelations.length} relation/view endpoint(s) and ${requiredFunctions.length} RPC endpoint(s).`,
  );
}

run().catch((error) => {
  console.error(
    error instanceof Error
      ? `Live Phase 0 hosted schema verification failed: ${error.message}`
      : "Live Phase 0 hosted schema verification failed with an unknown error.",
  );
  process.exitCode = 1;
});
