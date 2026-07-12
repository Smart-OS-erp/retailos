const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

const dataForwardMigrations = [
  "20260706100000_phase0_data_foundation.sql",
  "20260706110000_phase0_consolidation_hub.sql",
  "20260706120000_phase0_inventory_recovery_intelligence.sql",
  "20260706130000_phase0_projectisation_engine.sql",
  "20260706140000_phase0_retail_copilot.sql",
];

const hostedPendingMigrations = [
  "20260705140000_phase0_foundation_expansion.sql",
  ...dataForwardMigrations,
];

const fullPhase0Migrations = [
  "20260705113000_secure_technical_foundation.sql",
  ...hostedPendingMigrations,
];

const phase05Migrations = [
  "20260707100000_phase0_5_integration_hub.sql",
];

const args = process.argv.slice(2);
const useFullPhase0Set = args.includes("--full-phase0");
const useDataForwardOnly = args.includes("--data-forward-only");
const usePhase05Set = args.includes("--phase0-5");
const selectedMigrations = useDataForwardOnly
  ? dataForwardMigrations
  : usePhase05Set
  ? phase05Migrations
  : useFullPhase0Set
  ? fullPhase0Migrations
  : hostedPendingMigrations;

const writeIndex = args.indexOf("--write");
const outputPath = writeIndex === -1
  ? undefined
  : path.resolve(root, args[writeIndex + 1] || ".tmp/phase0-hosted-migration.sql");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readMigration(name) {
  const filePath = path.join(migrationsDir, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing migration file: ${name}`);
  }

  const sql = fs.readFileSync(filePath, "utf8").trim();
  return {
    name,
    sql,
    hash: sha256(sql),
  };
}

function buildBundle(migrations) {
  const mode = useDataForwardOnly
    ? "Phase 0 data-forward migration set for a database where foundation expansion already exists"
    : usePhase05Set
    ? "Phase 0.5 Integration Hub migration set for a database where Phase 0 already exists"
    : useFullPhase0Set
    ? "full Phase 0 migration set for a fresh non-production database"
    : "hosted pending Phase 0 set for the current retailos-dev blocker";
  const migrationList = migrations
    .map((migration, index) => `--   ${index + 1}. ${migration.name} (${migration.hash})`)
    .join("\n");
  const sections = migrations
    .map((migration) => [
      "-- -----------------------------------------------------------------------------",
      `-- Source migration: ${migration.name}`,
      `-- Source SHA256: ${migration.hash}`,
      "-- -----------------------------------------------------------------------------",
      migration.sql,
      "",
    ].join("\n"))
    .join("\n");

  return [
    "-- RetailOS hosted Supabase migration bundle",
    `-- Mode: ${mode}`,
    "--",
    "-- Safety:",
    "-- - Generated from committed migration files only.",
    "-- - Does not read, print, or require secrets.",
    "-- - Apply to the approved non-production Supabase project only.",
    "-- - Apply exactly once, in one transaction per source migration as authored.",
    "-- - Do not use the full set on a database where earlier migrations already exist.",
    "-- - Use --data-forward-only only when phase0_foundation_expansion already exists.",
    "--",
    "-- Included source files and SHA256 checksums:",
    migrationList,
    "",
    sections,
  ].join("\n");
}

try {
  const migrations = selectedMigrations.map(readMigration);
  const bundle = buildBundle(migrations);
  const bundleHash = sha256(bundle);
  const report = outputPath ? console.log : console.error;

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, bundle + "\n", "utf8");
    console.log(`Wrote hosted migration bundle: ${path.relative(root, outputPath)}`);
  } else {
    process.stdout.write(bundle + "\n");
  }

  report(`Bundle SHA256: ${bundleHash}`);
  report(
    useDataForwardOnly
      ? "Mode note: data-forward bundle assumes Phase 0 foundation expansion is already applied."
      : usePhase05Set
      ? "Mode note: Phase 0.5 bundle assumes all Phase 0 migrations are already applied."
      : useFullPhase0Set
      ? "Mode note: full Phase 0 bundle is only for a fresh non-production database."
      : "Mode note: pending bundle assumes secure technical foundation is already applied and includes Phase 0 foundation expansion.",
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? `Hosted migration bundle failed: ${error.message}`
      : "Hosted migration bundle failed with an unknown error.",
  );
  process.exitCode = 1;
}
