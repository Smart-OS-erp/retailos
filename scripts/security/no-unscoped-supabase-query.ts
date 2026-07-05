const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const sourceRoots = ["app", "src", "pages", "lib"].map((name) => path.join(root, name)).filter(fs.existsSync);
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "coverage"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) files.push(target);
  }
}
sourceRoots.forEach(walk);

const violations = [];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  if (!/\.from\s*\(/.test(source)) continue;
  if (!/(organization_id|tenant_id|activeOrganization|organizationId|tenantId|RLS_SCOPED_REVIEWED)/.test(source)) {
    violations.push(file);
  }
}
if (violations.length) {
  console.error("Potentially unscoped Supabase queries found:\n" + violations.map((file) => `- ${path.relative(root, file)}`).join("\n"));
  process.exitCode = 1;
} else if (!files.length) {
  console.log("TODO (safe): no application source exists; Supabase query scope scan is not yet applicable.");
} else {
  console.log("Supabase query scope scan passed. Current tenant tables are also covered by behavioral RLS integration tests.");
}
