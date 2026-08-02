const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const root = path.resolve(__dirname, "../..");
const envPath = path.join(root, ".env.local");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "Live Phase 2 hosted schema verification blocked: configure DATABASE_URL in ignored .env.local.",
  );
  process.exit(1);
}

const requiredRelations = [
  "assortment_plan_items",
  "markdown_plan_drafts",
  "merchandising_collections",
  "merchandising_group_performance",
  "merchandising_plan_cycles",
  "merchandising_recommendations",
  "product_collection_assignments",
  "product_productivity_metrics",
];

const requiredFunctions = [
  "add_assortment_plan_item",
  "approve_merchandising_plan_cycle",
  "create_markdown_plan_draft",
  "create_merchandising_plan_cycle",
  "generate_merchandising_recommendations",
];

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const relations = await client.query(
      `select table_name
       from information_schema.tables
       where table_schema = 'public'
         and table_name = any($1::text[])
       order by table_name`,
      [requiredRelations],
    );
    const functions = await client.query(
      `select proname
       from pg_proc procedure
       join pg_namespace namespace
         on namespace.oid = procedure.pronamespace
       where namespace.nspname = 'public'
         and proname = any($1::text[])
       order by proname`,
      [requiredFunctions],
    );

    const presentRelations = new Set(
      relations.rows.map((row) => row.table_name),
    );
    const presentFunctions = new Set(functions.rows.map((row) => row.proname));
    const missingRelations = requiredRelations.filter(
      (relation) => !presentRelations.has(relation),
    );
    const missingFunctions = requiredFunctions.filter(
      (fn) => !presentFunctions.has(fn),
    );

    if (missingRelations.length || missingFunctions.length) {
      console.error(
        JSON.stringify({
          missingFunctions,
          missingRelations,
          status: "failed",
        }),
      );
      process.exit(1);
    }

    console.log(
      JSON.stringify({
        functions: requiredFunctions.length,
        relations: requiredRelations.length,
        status: "passed",
      }),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Live Phase 2 hosted schema verification failed:", error.message);
  process.exit(1);
});
