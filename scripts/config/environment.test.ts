import { describe, expect, it } from "vitest";
import { aiSmokeConfiguration, databaseSmokeConfiguration } from "./environment";

describe("developer-only smoke configuration", () => {
  it("runs only mock AI and skips the database without credentials", () => {
    expect(aiSmokeConfiguration({})).toEqual({ status: "ready", config: { provider: "mock" } });
    expect(databaseSmokeConfiguration({}).status).toBe("skipped");
  });
  it("does not authorize Gemini simply because a key exists", () => {
    expect(aiSmokeConfiguration({ AI_PROVIDER: "mock", GEMINI_API_KEY: "private-test-value" })).toEqual({ status: "ready", config: { provider: "mock" } });
    const result = aiSmokeConfiguration({ AI_PROVIDER: "gemini", GEMINI_API_KEY: "private-test-value" });
    expect(result.status).toBe("skipped");
    expect(JSON.stringify(result)).not.toContain("private-test-value");
  });
  it("requires confirmation and rejects paid-use switches", () => {
    expect(aiSmokeConfiguration({ AI_PROVIDER: "gemini", ENABLE_LIVE_AI_SMOKE: "true" }).status).toBe("skipped");
    expect(() => aiSmokeConfiguration({ AI_PROVIDER: "gemini", ENABLE_LIVE_AI_SMOKE: "true", FREE_TIER_CONFIRMED: "true", ALLOW_PAID_AI: "true" })).toThrow(/paid/i);
  });
  it("refuses a database URL that does not match the explicitly named project", () => {
    expect(() => databaseSmokeConfiguration({ ENABLE_DB_SMOKE: "true", SUPABASE_URL: "https://wrong.supabase.co", SUPABASE_PROJECT_REF: "intended", SUPABASE_SECRET_KEY: "private-test-value" })).toThrow(/project/i);
  });
});
