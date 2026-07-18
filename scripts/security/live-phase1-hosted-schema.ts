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
    "Live Phase 1 hosted schema verification blocked: configure DATABASE_URL in ignored .env.local.",
  );
  process.exit(1);
}

const requiredRelations = [
  "current_inventory_balances",
  "inventory_lookup_items",
  "inventory_movements",
  "inventory_operation_idempotency_keys",
  "inventory_stock_watchlist",
  "reconciliation_issues",
  "stock_adjustment_items",
  "stock_adjustments",
  "stock_count_items",
  "stock_counts",
  "transfer_discrepancies",
  "transfer_items",
  "transfer_requests",
];

const requiredFunctions = [
  "approve_stock_adjustment",
  "approve_transfer_request",
  "create_stock_adjustment",
  "create_transfer_request",
  "dispatch_transfer_request",
  "execute_stock_adjustment",
  "receive_transfer_request",
  "reject_stock_adjustment",
  "reject_transfer_request",
  "review_stock_count",
  "reverse_stock_adjustment",
  "search_inventory_items",
  "submit_stock_count",
  "close_stock_count",
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
  console.error("Live Phase 1 hosted schema verification failed:", error.message);
  process.exit(1);
});
