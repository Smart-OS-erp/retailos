const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const requiredKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
];
const optionalKeys = [
  "IMPORT_API_TOKEN_HASH_SECRET",
  "SHOPIFY_CONNECTOR_CREDENTIALS_JSON",
  "WOOCOMMERCE_CONNECTOR_CREDENTIALS_JSON",
  "CRON_SECRET",
];
const allowedKeySet = new Set([...requiredKeys, ...optionalKeys]);
const examplePath = path.join(root, ".env.example");
const envFiles = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) =>
    entry.isFile()
    && (
      entry.name === ".env"
      || entry.name === ".env.local"
      || /^\.env\..+\.local$/.test(entry.name)
    ))
  .map((entry) => path.join(root, entry.name));

const violations = [];
function readVariables(file) {
  const variables = new Map();
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    variables.set(match[1], { line: index + 1, value: match[2] });
  }
  return variables;
}

if (!fs.existsSync(examplePath)) {
  violations.push(".env.example is required");
} else {
  const exampleVariables = readVariables(examplePath);
  for (const key of requiredKeys) {
    if (!exampleVariables.has(key)) {
      violations.push(`.env.example is missing ${key}`);
    }
  }
  for (const [key, metadata] of exampleVariables) {
    if (!allowedKeySet.has(key)) {
      violations.push(`.env.example:${metadata.line} contains unexpected variable ${key}`);
    }
    if (metadata.value.trim() !== "") {
      violations.push(`.env.example:${metadata.line} must not contain a value for ${key}`);
    }
  }
}

const runtimeKeys = new Set();
for (const file of envFiles) {
  const variables = readVariables(file);
  for (const [originalKey, metadata] of variables) {
    const key = originalKey.toUpperCase();
    runtimeKeys.add(originalKey);
    if (key.startsWith("NEXT_PUBLIC_") && /(SERVICE_ROLE|SECRET|PRIVATE_KEY|DATABASE_URL)/.test(key)) {
      violations.push(`${path.basename(file)}:${metadata.line} exposes privileged key ${originalKey}`);
    }
  }
}

if (envFiles.length) {
  for (const key of requiredKeys) {
    if (!runtimeKeys.has(key)) {
      violations.push(`runtime environment files are missing required variable ${key}`);
    }
  }
}

if (violations.length) {
  console.error("Environment safety check failed:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else if (!envFiles.length) {
  console.log("Environment example contract passed. TODO (safe): create an ignored .env.local with the four required variables; values were not inspected or printed.");
} else {
  console.log("Environment key-name contract passed; secret values were not printed.");
}
