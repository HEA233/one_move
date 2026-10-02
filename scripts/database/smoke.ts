import { randomUUID } from "node:crypto";
import { z } from "zod";
import { databaseSmokeConfiguration } from "../config/environment";

const payload = { purpose: "preparation-connectivity", isPersonal: false } as const;
const recordSchema = z.object({ id: z.string().uuid(), run_id: z.string().uuid(), payload: z.object({ purpose: z.literal("preparation-connectivity"), isPersonal: z.literal(false) }) });
type DatabaseSmokeResult = { status: "PASS"; cleanup: "PASS" } | { status: "SKIPPED_ENV"; reason: string } | { status: "FAIL"; reason: string; cleanup?: "PASS" | "FAIL" };
export async function runDatabaseSmoke(environment: Record<string, string | undefined>, transport?: typeof fetch): Promise<DatabaseSmokeResult> {
  let readiness;
  try { readiness = databaseSmokeConfiguration(environment); }
  catch (error) { return { status: "FAIL", reason: error instanceof Error ? error.message : "Invalid database configuration." }; }
  if (readiness.status === "skipped") return { status: "SKIPPED_ENV", reason: readiness.reason };
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(readiness.config.url, readiness.config.secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    db: { retry: false, timeout: 10_000 }, global: { fetch: transport },
  });
  const row = { id: randomUUID(), run_id: randomUUID(), payload };
  let reason: string | null = null;
  let cleanup: "PASS" | "FAIL" = "FAIL";
  try {
    const inserted = await client.from("prep_checks").insert(row);
    if (inserted.error) {
      reason = "Database insert failed.";
    } else {
      const read = await client.from("prep_checks").select("id,run_id,payload").eq("id", row.id).eq("run_id", row.run_id).single();
      const parsed = recordSchema.safeParse(read.data);
      if (read.error || !parsed.success || JSON.stringify(parsed.data) !== JSON.stringify(row)) reason = "Database read or record validation failed.";
    }
  } catch {
    reason = "Database request failed.";
  } finally {
    try {
      const removed = await client.from("prep_checks").delete().eq("id", row.id).eq("run_id", row.run_id).select("id");
      const rows = z.array(z.object({ id: z.literal(row.id) })).max(1).safeParse(removed.data);
      cleanup = !removed.error && rows.success ? "PASS" : "FAIL";
    } catch {
      cleanup = "FAIL";
    }
  }
  if (cleanup === "FAIL") return { status: "FAIL", reason: reason ? `${reason} Cleanup also failed.` : "Database check passed, but cleanup failed.", cleanup };
  return reason ? { status: "FAIL", reason, cleanup } : { status: "PASS", cleanup };
}
