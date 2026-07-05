const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const sourceRoots = ["app", "src", "pages", "components"]
  .map((name) => path.join(root, name))
  .filter(fs.existsSync);
const extensions = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "coverage"].includes(entry.name)) {
      continue;
    }
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (extensions.includes(path.extname(entry.name))) files.push(target);
  }
}

sourceRoots.forEach(walk);

function resolveImport(importer, specifier) {
  let base;
  if (specifier.startsWith("@/")) {
    base = path.join(root, "src", specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(importer), specifier);
  } else {
    return undefined;
  }

  const candidates = [
    base,
    ...extensions.map((extension) => base + extension),
    ...extensions.map((extension) => path.join(base, "index" + extension)),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function importsFor(file) {
  const source = fs.readFileSync(file, "utf8");
  const specifiers = [
    ...source.matchAll(
      /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    ),
  ].map((match) => match[1]);
  return specifiers
    .map((specifier) => resolveImport(file, specifier))
    .filter(Boolean);
}

const clientEntries = files.filter((file) => {
  const source = fs.readFileSync(file, "utf8");
  return (
    /^\s*["']use client["'];/m.test(source)
    || /(?:browser|client)\.(?:js|jsx|ts|tsx)$/.test(file)
  );
});

const sensitivePattern =
  /SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|service[_-]?role/i;
const violations = [];

for (const entry of clientEntries) {
  const queue = [entry];
  const visited = new Set();

  while (queue.length) {
    const file = queue.shift();
    if (!file || visited.has(file)) continue;
    visited.add(file);

    const source = fs.readFileSync(file, "utf8");
    if (sensitivePattern.test(source)) {
      violations.push(
        `${path.relative(root, entry)} reaches server credential material in ${path.relative(root, file)}`,
      );
    }
    queue.push(...importsFor(file));
  }
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  if (/NEXT_PUBLIC_[A-Z0-9_]*(?:SERVICE_ROLE|DATABASE_URL|SECRET)/.test(source)) {
    violations.push(
      `${path.relative(root, file)} defines a privileged NEXT_PUBLIC_ variable`,
    );
  }
}

if (violations.length) {
  console.error(
    "Service-role client boundary check failed:\n"
      + violations.map((item) => `- ${item}`).join("\n"),
  );
  process.exitCode = 1;
} else if (!files.length) {
  console.log(
    "TODO (safe): no application source exists; service-role client scan is not yet applicable.",
  );
} else if (!clientEntries.length) {
  console.log(
    "TODO (safe): application source exists but no browser entry was detected.",
  );
} else {
  console.log(
    `Service-role client boundary passed across ${clientEntries.length} browser entry point(s).`,
  );
}
