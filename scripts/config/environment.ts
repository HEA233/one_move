import { createRequire } from "node:module";
import { z } from "zod";

export const environmentSchema = z.object({
  AI_PROVIDER: z.enum(["mock", "gemini"]).optional(),
  ENABLE_LIVE_AI_SMOKE: z.enum(["true", "false"]).optional(),
  FREE_TIER_CONFIRMED: z.enum(["true", "false"]).optional(),
  ALLOW_PAID_AI: z.enum(["true", "false"]).optional(),
  ALLOW_EXTERNAL_AI_IN_WEB: z.enum(["true", "false"]).optional(),
  GEMINI_MODEL: z.string().optional(), GEMINI_API_KEY: z.string().optional(),
  ENABLE_DB_SMOKE: z.enum(["true", "false"]).optional(),
  SUPABASE_URL: z.union([z.literal(""), z.string().url()]).optional(),
  SUPABASE_PROJECT_REF: z.string().optional(), SUPABASE_PUBLISHABLE_KEY: z.string().optional(), SUPABASE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.union([z.literal(""), z.string().url()]).optional(),
});
export function loadLocalEnvironment() {
  const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");
  loadEnvConfig(process.cwd(), true, { info: () => undefined, error: () => undefined });
}
export type ModelConfiguration = { provider: "mock" } | { provider: "gemini"; apiKey: string; model: string };
type Readiness<T> = { status: "ready"; config: T } | { status: "skipped"; reason: string };
function parseEnvironment(environment: Record<string, string | undefined>) {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) throw new Error(`Invalid configuration: ${[...new Set(parsed.error.issues.map((issue) => issue.path[0]))].join(", ")}.`);
  return parsed.data;
}
export function aiSmokeConfiguration(environment: Record<string, string | undefined>): Readiness<ModelConfiguration> {
  const env = parseEnvironment(environment);
  if ((env.AI_PROVIDER ?? "mock") === "mock") return { status: "ready", config: { provider: "mock" } };
  if (env.ALLOW_PAID_AI === "true") throw new Error("Paid AI use is outside this preparation scope.");
  if (env.ALLOW_EXTERNAL_AI_IN_WEB === "true") throw new Error("External AI in the web preview is outside this preparation scope.");
  const missing = [
    env.ENABLE_LIVE_AI_SMOKE !== "true" && "ENABLE_LIVE_AI_SMOKE=true",
    env.FREE_TIER_CONFIRMED !== "true" && "FREE_TIER_CONFIRMED=true",
    !env.GEMINI_API_KEY && "GEMINI_API_KEY",
    !env.GEMINI_MODEL && "GEMINI_MODEL",
  ].filter(Boolean);
  return missing.length ? { status: "skipped", reason: `Required: ${missing.join(", ")}.` } : { status: "ready", config: { provider: "gemini", apiKey: env.GEMINI_API_KEY!, model: env.GEMINI_MODEL! } };
}
export function databaseSmokeConfiguration(environment: Record<string, string | undefined>): Readiness<{ url: string; secretKey: string }> {
  const env = parseEnvironment(environment);
  if (env.ENABLE_DB_SMOKE !== "true") return { status: "skipped", reason: "Required: ENABLE_DB_SMOKE=true." };
  const missing = [!env.SUPABASE_URL && "SUPABASE_URL", !env.SUPABASE_PROJECT_REF && "SUPABASE_PROJECT_REF", !env.SUPABASE_SECRET_KEY && "SUPABASE_SECRET_KEY"].filter(Boolean);
  if (missing.length) return { status: "skipped", reason: `Required: ${missing.join(", ")}.` };
  const target = new URL(env.SUPABASE_URL!);
  if (target.origin !== `https://${env.SUPABASE_PROJECT_REF}.supabase.co` || target.pathname !== "/" || target.search || target.hash || target.username || target.password) throw new Error("Supabase URL must match the explicitly named hosted test project.");
  return { status: "ready", config: { url: target.origin, secretKey: env.SUPABASE_SECRET_KEY! } };
}
