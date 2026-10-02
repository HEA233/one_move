import { createRequire } from "node:module";
import { z } from "zod";

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd(), true, { info: () => undefined, error: () => undefined });

const schema = z.object({
  AI_PROVIDER: z.enum(["mock", "gemini"]).optional(),
  ENABLE_LIVE_AI_SMOKE: z.enum(["true", "false"]).optional(),
  FREE_TIER_CONFIRMED: z.enum(["true", "false"]).optional(),
  ALLOW_PAID_AI: z.enum(["true", "false"]).optional(),
  ALLOW_EXTERNAL_AI_IN_WEB: z.enum(["true", "false"]).optional(),
  GEMINI_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ENABLE_DB_SMOKE: z.enum(["true", "false"]).optional(),
  SUPABASE_URL: z.union([z.literal(""), z.string().url()]).optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.union([z.literal(""), z.string().url()]).optional(),
});

const names = Object.keys(schema.shape) as Array<keyof typeof schema.shape>;
const environment = Object.fromEntries(names.map((name) => [name, process.env[name]]));
const result = schema.safeParse(environment);
const invalidNames = new Set(
  result.success ? [] : result.error.issues.map((issue) => String(issue.path[0])),
);

for (const name of names) {
  const value = environment[name];
  const status = invalidNames.has(name)
    ? "invalid"
    : typeof value === "string" && value.length > 0
      ? "configured"
      : "missing";
  process.stdout.write(`${name}: ${status}\n`);
}

if (invalidNames.size > 0) {
  process.exitCode = 1;
}
