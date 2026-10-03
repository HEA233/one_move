import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const apiRoot = join(sourceRoot, "app", "api");
const allowedRoutes = new Set([
  "src/app/api/health/route.ts",
  "src/app/api/play/start/route.ts",
  "src/app/api/play/[roundId]/state/route.ts",
  "src/app/api/play/[roundId]/initial/route.ts",
  "src/app/api/play/[roundId]/move/ensure/route.ts",
  "src/app/api/play/[roundId]/exposure/route.ts",
  "src/app/api/play/[roundId]/final/route.ts",
  "src/app/api/play/[roundId]/abort/route.ts",
  "src/app/api/play/[roundId]/again/route.ts",
  "src/app/api/brand-live/summary/route.ts",
]);
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

if (routeFiles.length !== allowedRoutes.size || routeFiles.some((route) => !allowedRoutes.has(route))) {
  failures.push("An API route exists outside the approved ONE MOVE v2 route set.");
}

const forbiddenPatterns = [
  { label: "fetch request", pattern: /\bfetch\s*\(/ },
  { label: "external network transport", pattern: /\bXMLHttpRequest\b|\bWebSocket\b/ },
  { label: "Google GenAI SDK import", pattern: /@google\/genai/ },
  { label: "Supabase SDK import", pattern: /@supabase\/supabase-js/ },
  { label: "external URL literal", pattern: /https?:\/\/(?!www\.w3\.org\/2000\/svg\b)/ },
  { label: "secret-like value", pattern: /\b(?:AIza[0-9A-Za-z_-]{30,}|sb_secret_[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9_-]{20,})\b/ },
];

for (const file of sourceFiles) {
  const content = readFileSync(file, "utf8");
  const relativeFile = relative(root, file);
  const isOneMoveServer = relativeFile.startsWith("src/features/one-move/server/");
  const isOneMoveFeature = relativeFile.startsWith("src/features/one-move/");
  for (const match of content.matchAll(/\b(?:from\s*|import\s*\(|import\s*)["']([^"']+)["']/g)) {
    const imported = match[1];
    const target = imported.startsWith("@/") ? resolve(sourceRoot, imported.slice(2)) : imported.startsWith(".") ? resolve(dirname(file), imported) : null;
    if (target && relative(root, target).startsWith("scripts/")) failures.push(`CLI integration import found in ${relativeFile}.`);
  }
  if (/["']use server["']/.test(content)) failures.push(`Server action found in ${relativeFile}.`);
  if (!isOneMoveServer && /GEMINI_API_KEY|SUPABASE_SECRET_KEY/.test(content)) failures.push(`Private configuration referenced in ${relativeFile}.`);
  for (const { label, pattern } of forbiddenPatterns) {
    const allowedIntegration = label === "Supabase SDK import" && relativeFile === "src/features/one-move/server/supabase-repository.ts";
    const allowedPlayerRequest = label === "fetch request" && relativeFile === "src/features/one-move/shopper/client.ts";
    const allowedPublicSource = label === "external URL literal" && isOneMoveFeature;
    if (pattern.test(content) && !allowedIntegration && !allowedPublicSource && !allowedPlayerRequest) {
      failures.push(`${label} found in ${relativeFile}.`);
    }
  }
}

const staticRoot = join(root, ".next", "static");
if (existsSync(staticRoot)) {
  for (const file of collectFiles(staticRoot).filter((path) => path.endsWith(".js"))) {
    if (/GoogleGenAI|generativelanguage\.googleapis\.com|SUPABASE_SECRET_KEY|GEMINI_API_KEY|sb_secret_[A-Za-z0-9_-]{20,}/.test(readFileSync(file, "utf8"))) failures.push(`Integration or private configuration found in client build ${relative(root, file)}.`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stderr.write(`FAIL: ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write("PASS: approved ONE MOVE v2 routes keep service integrations server-side and out of the client build.\n");
}
