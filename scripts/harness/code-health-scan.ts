const { readdirSync, readFileSync, statSync } = require("node:fs");
const { join } = require("node:path");

const roots = ["src", "tests", "scripts"];
const trackedExtensions = new Set([".ts", ".tsx", ".sql", ".css"]);
const findings = {
  files: 0,
  totalLines: 0,
  oversized: [] as Array<{ path: string; lines: number }>,
  anyCount: 0,
  tsIgnoreCount: 0,
  nonNullAssertions: 0,
  eslintDisableCount: 0,
  todoCount: 0,
};

function extension(path: string): string {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function walk(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else if (entry.isFile() && trackedExtensions.has(extension(path))) {
      files.push(path);
    }
  }
  return files;
}

for (const root of roots) {
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/).length;
    findings.files += 1;
    findings.totalLines += lines;
    if (lines >= 250) {
      findings.oversized.push({ path: file.replaceAll("\\", "/"), lines });
    }
    findings.anyCount += text.match(/\bany\b/g)?.length ?? 0;
    findings.tsIgnoreCount += text.match(/@ts-ignore|@ts-expect-error/g)?.length ?? 0;
    findings.nonNullAssertions += text.match(/!\./g)?.length ?? 0;
    findings.eslintDisableCount += text.match(/eslint-disable/g)?.length ?? 0;
    findings.todoCount += text.match(/TODO|FIXME/g)?.length ?? 0;
  }
}

findings.oversized.sort((a, b) => b.lines - a.lines);

const migrations = readdirSync("supabase/migrations")
  .filter((file) => file.endsWith(".sql"))
  .map((file) => {
    const path = join("supabase/migrations", file);
    return {
      file,
      bytes: statSync(path).size,
      lines: readFileSync(path, "utf8").split(/\r?\n/).length,
    };
  })
  .sort((a, b) => b.lines - a.lines);

console.log(
  JSON.stringify(
    {
      ...findings,
      oversized: findings.oversized.slice(0, 25),
      largestMigrations: migrations.slice(0, 10),
    },
    null,
    2,
  ),
);
