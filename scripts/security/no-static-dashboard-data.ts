const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const sourceRoots = ["app", "src", "pages"].map((name) => path.join(root, name)).filter(fs.existsSync);
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

const suspicious = /(mock(?:Dashboard)?Data|hardcodedData|Math\.random\s*\(|TODO_STATIC_DASHBOARD)/i;
const violations = files.filter((file) => /dashboard/i.test(file) && suspicious.test(fs.readFileSync(file, "utf8")));
if (violations.length) {
  console.error("Static dashboard data check failed:\n" + violations.map((file) => `- ${path.relative(root, file)}`).join("\n"));
  process.exitCode = 1;
} else if (!files.length) {
  console.log("TODO (safe): no application source exists; static dashboard data scan is not yet applicable.");
} else {
  console.log("Heuristic dashboard scan passed. TODO: require provenance-aware integration tests for implemented metrics.");
}
