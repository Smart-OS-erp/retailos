const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const candidates = [path.join(root, "app"), path.join(root, "src", "app"), path.join(root, "pages", "api")].filter(fs.existsSync);
const routeFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/route\.(?:js|ts)$/.test(entry.name) || target.includes(`${path.sep}pages${path.sep}api${path.sep}`)) routeFiles.push(target);
  }
}
candidates.forEach(walk);

const hasHandler = /export\s+(?:async\s+)?(?:function|const)\s+(?:GET|POST|PUT|PATCH|DELETE)|export\s+default/;
const protectionMarker = /(requireAuth|withAuth|authorize|assertPermission|getUser\s*\(|auth\.getUser|PUBLIC_ROUTE_REVIEWED)/;
const violations = routeFiles.filter((file) => {
  const source = fs.readFileSync(file, "utf8");
  return hasHandler.test(source) && !protectionMarker.test(source);
});
if (violations.length) {
  console.error("Potentially unprotected API routes found:\n" + violations.map((file) => `- ${path.relative(root, file)}`).join("\n"));
  process.exitCode = 1;
} else if (!routeFiles.length) {
  console.log("TODO (safe): no API routes exist; route protection scan is not yet applicable.");
} else {
  console.log(`API route protection contract passed for ${routeFiles.length} route file(s). Keep public-route allowlists and negative Auth tests under review.`);
}
