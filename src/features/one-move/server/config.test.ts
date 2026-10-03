import { describe, expect, it } from "vitest";
import { databaseReady, readOneMoveConfig } from "./config";

describe("ONE MOVE runtime configuration", () => {
  it("defaults to curated, contextual, observer-off operation without persistence", () => {
    const config = readOneMoveConfig({});
    expect(config).toMatchObject({
      protocolVersion: "2.0",
      campaignId: "one-move-mobile-pilot-v2",
      movePolicy: "contextual_v2",
      selector: "curated",
      liveApproved: false,
      observerEnabled: false,
    });
    expect(databaseReady(config)).toBe(false);
  });

  it("treats blank optional dotenv values as unset", () => {
    const config = readOneMoveConfig({ SUPABASE_URL: "", SUPABASE_SECRET_KEY: "", OBSERVER_ACCESS_KEY: "" });
    expect(databaseReady(config)).toBe(false);
    expect(config.observerAccessKey).toBeNull();
  });

  it("does not treat a model key or live mode as approval by itself", () => {
    const config = readOneMoveConfig({ AI_MODE: "live", GEMINI_API_KEY: "private-test-value", GEMINI_MODEL: "gemini-test" });
    expect(config.liveApproved).toBe(false);
    expect(config.selector).toBe("live");
  });

  it("requires the explicit approval flag before live selection can be considered", () => {
    const config = readOneMoveConfig({ AI_MODE: "live", AI_USE_APPROVED: "true", GEMINI_API_KEY: "private-test-value", GEMINI_MODEL: "gemini-test" });
    expect(config.liveApproved).toBe(true);
    expect(config.modelKey).toBe("private-test-value");
  });
});
