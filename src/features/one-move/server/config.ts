import "server-only";
import { z } from "zod";

const environmentSchema = z.object({
  ONE_MOVE_PROTOCOL_VERSION: z.string().min(1).optional(),
  ONE_MOVE_CAMPAIGN_ID: z.string().min(1).max(120).optional(),
  MOVE_POLICY: z.enum(["contextual_v2"]).optional(),
  AI_MODE: z.enum(["curated", "live"]).optional(),
  AI_USE_APPROVED: z.enum(["true", "false"]).optional(),
  AI_MAX_CAMPAIGN_ATTEMPTS: z.coerce.number().int().positive().optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  BRAND_OBSERVER_ENABLED: z.enum(["true", "false"]).optional(),
  OBSERVER_ACCESS_KEY: z.string().min(1).optional(),
});

export interface OneMoveConfig {
  protocolVersion: "2.0";
  campaignId: string;
  movePolicy: "contextual_v2";
  selector: "curated" | "live";
  liveApproved: boolean;
  model: string | null;
  modelKey: string | null;
  maxCampaignAttempts: number;
  supabaseUrl: string | null;
  supabaseSecretKey: string | null;
  observerEnabled: boolean;
  observerAccessKey: string | null;
}

export function readOneMoveConfig(environment: Record<string, string | undefined> = process.env): OneMoveConfig {
  const parsed = environmentSchema.parse(environment);
  const selector = parsed.AI_MODE ?? "curated";
  const liveApproved = selector === "live" && parsed.AI_USE_APPROVED === "true";
  return {
    protocolVersion: "2.0",
    campaignId: parsed.ONE_MOVE_CAMPAIGN_ID ?? "one-move-mobile-pilot-v2",
    movePolicy: parsed.MOVE_POLICY ?? "contextual_v2",
    selector,
    liveApproved,
    model: parsed.GEMINI_MODEL ?? null,
    modelKey: parsed.GEMINI_API_KEY ?? null,
    maxCampaignAttempts: parsed.AI_MAX_CAMPAIGN_ATTEMPTS ?? 30,
    supabaseUrl: parsed.SUPABASE_URL ?? null,
    supabaseSecretKey: parsed.SUPABASE_SECRET_KEY ?? null,
    observerEnabled: parsed.BRAND_OBSERVER_ENABLED === "true",
    observerAccessKey: parsed.OBSERVER_ACCESS_KEY ?? null,
  };
}

export function databaseReady(config: OneMoveConfig): boolean {
  return Boolean(config.supabaseUrl && config.supabaseSecretKey);
}
