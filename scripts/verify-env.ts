const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const envFiles = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.startsWith(".env") && !entry.name.endsWith(".example"))
  .map((entry) => path.join(root, entry.name));

const violations = [];
for (const file of envFiles) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!match) continue;
    const key = match[1].toUpperCase();
    if (key.startsWith("NEXT_PUBLIC_") && /(SERVICE_ROLE|SECRET|PRIVATE_KEY|DATABASE_URL)/.test(key)) {
      violations.push(`${path.basename(file)}:${index + 1} exposes privileged key ${match[1]}`);
    }
  }
}

if (violations.length) {
  console.error("Environment safety check failed:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else if (!envFiles.length) {
  console.log("TODO (safe): no runtime environment files exist; validate required variables after the application scaffold is added.");
} else {
  console.log("Environment key-name check passed. TODO: add schema-based value and environment validation with the scaffold.");
}
