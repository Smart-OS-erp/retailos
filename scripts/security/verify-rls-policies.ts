const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const migrations = path.join(root, "supabase", "migrations");
const sqlFiles = fs.existsSync(migrations)
  ? fs.readdirSync(migrations).filter((name) => name.endsWith(".sql")).map((name) => path.join(migrations, name))
  : [];

const sql = sqlFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n").toLowerCase();
const tenantTables = [...sql.matchAll(/create\s+table(?:\s+if\s+not\s+exists)?\s+(?:public\.)?["']?([a-z0-9_]+)["']?[\s\S]*?;/g)]
  .filter((match) => /\b(?:organization_id|tenant_id)\b/.test(match[0]))
  .map((match) => match[1]);
const violations = tenantTables.filter((table) => {
  const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rls = new RegExp(`alter\\s+table(?:\\s+only)?\\s+(?:public\\.)?["']?${escaped}["']?\\s+enable\\s+row\\s+level\\s+security`);
  const policy = new RegExp(`create\\s+policy[\\s\\S]*?\\s+on\\s+(?:public\\.)?["']?${escaped}["']?`);
  return !rls.test(sql) || !policy.test(sql);
});

if (violations.length) {
  console.error("RLS policy check failed for tenant tables:\n" + violations.map((table) => `- ${table}`).join("\n"));
  process.exitCode = 1;
} else if (!sqlFiles.length) {
  console.log("TODO (safe): no SQL migrations exist; RLS verification is not yet applicable.");
} else if (!tenantTables.length) {
  console.log("TODO (safe): migrations contain no detected tenant tables; review schema classification before relying on this check.");
} else {
  console.log(`Heuristic RLS check passed for ${tenantTables.length} tenant table(s). TODO: add live policy behavior tests.`);
}
