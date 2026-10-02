import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const apiRoot = join(sourceRoot, "app", "api");
const allowedRoute = "src/app/api/health/route.ts";
const failures: string[] = [];

function collectFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });
}

const sourceFiles = collectFiles(sourceRoot).filter((path) => /\.(ts|tsx)$/.test(path));
const routeFiles = collectFiles(apiRoot)
  .filter((path) => path.endsWith("/route.ts"))
  .map((path) => relative(root, path));

if (routeFiles.length !== 1 || routeFiles[0] !== allowedRoute) {
  failures.push("Only GET /api/health is allowed in Stage 1.");
}

const forbiddenPatterns = [
  { label: "external network request", pattern: /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/ },
  { label: "Google GenAI SDK import", pattern: /@google\/genai/ },
  { label: "Supabase SDK import", pattern: /@supabase\/supabase-js/ },
  { label: "external URL literal", pattern: /https?:\/\// },
  { label: "secret-like value", pattern: /\b(?:AIza[0-9A-Za-z_-]{30,}|sb_secret_[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9_-]{20,})\b/ },
];

for (const file of sourceFiles) {
  const content = readFileSync(file, "utf8");
  for (const { label, pattern } of forbiddenPatterns) {
    if (pattern.test(content)) {
      failures.push(`${label} found in ${relative(root, file)}.`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stderr.write(`FAIL: ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write("PASS: Stage 1 has one health route and no external service calls or embedded secrets.\n");
}
