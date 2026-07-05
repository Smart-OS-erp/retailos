const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const migrations = path.join(root, "supabase", "migrations");
const sqlFiles = fs.existsSync(migrations)
  ? fs
      .readdirSync(migrations)
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .map((name) => path.join(migrations, name))
  : [];

const sql = sqlFiles
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n")
  .toLowerCase();
const publicTables = [
  ...sql.matchAll(
    /create\s+table(?:\s+if\s+not\s+exists)?\s+public\.["']?([a-z0-9_]+)["']?/g,
  ),
].map((match) => match[1]);
const violations = [];

for (const table of publicTables) {
  const escaped = table.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
  const enable = new RegExp(
    `alter\\s+table\\s+public\\.["']?${escaped}["']?\\s+enable\\s+row\\s+level\\s+security`,
  );
  const force = new RegExp(
    `alter\\s+table\\s+public\\.["']?${escaped}["']?\\s+force\\s+row\\s+level\\s+security`,
  );
  const policy = new RegExp(
    `create\\s+policy[\\s\\S]*?on\\s+public\\.["']?${escaped}["']?[\\s\\S]*?to\\s+authenticated`,
  );
  const revokeAnon = new RegExp(
    `revoke\\s+all\\s+on\\s+table\\s+public\\.["']?${escaped}["']?\\s+from\\s+anon`,
  );

  if (!enable.test(sql)) violations.push(`${table}: RLS is not enabled`);
  if (!force.test(sql)) violations.push(`${table}: FORCE RLS is missing`);
  if (!policy.test(sql)) {
    violations.push(`${table}: no authenticated policy was detected`);
  }
  if (!revokeAnon.test(sql)) {
    violations.push(`${table}: explicit anon privilege revocation is missing`);
  }
}

if (/create\s+policy[\s\S]*?to\s+anon/.test(sql)) {
  violations.push("an anon RLS policy is present in the migration set");
}

if (/using\s*\(\s*true\s*\)/.test(sql)) {
  violations.push("a permissive USING (true) RLS policy is present");
}

if (violations.length) {
  console.error(
    "RLS policy contract failed:\n"
      + violations.map((item) => `- ${item}`).join("\n"),
  );
  process.exitCode = 1;
} else if (!sqlFiles.length) {
  console.log(
    "TODO (safe): no SQL migrations exist; RLS verification is not yet applicable.",
  );
} else if (!publicTables.length) {
  console.log(
    "TODO (safe): migrations contain no public tables; review schema classification.",
  );
} else {
  console.log(
    `RLS migration contract passed for ${publicTables.length} public table(s). Run npm run test:integration for behavioral isolation evidence.`,
  );
}
