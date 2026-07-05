const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const sourceRoots = ["app", "src", "pages", "components"].map((name) => path.join(root, name)).filter(fs.existsSync);
const extensions = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "coverage"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (extensions.has(path.extname(entry.name))) files.push(target);
  }
}
sourceRoots.forEach(walk);

const pattern = /SUPABASE_SERVICE_ROLE(?:_KEY)?|service[_-]?role/i;
const violations = files.filter((file) => pattern.test(fs.readFileSync(file, "utf8")));
if (violations.length) {
  console.error("Service-role client check failed:\n" + violations.map((file) => `- ${path.relative(root, file)}`).join("\n"));
  process.exitCode = 1;
} else if (!files.length) {
  console.log("TODO (safe): no application source exists; service-role client scan is not yet applicable.");
} else {
  console.log("Heuristic service-role client scan passed. TODO: add client-bundle secret scanning.");
}
