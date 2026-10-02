import { expect, it } from "vitest";
import { runAiSmoke } from "./smoke";

it("passes a mock text check while explicitly leaving the real service unverified", async () => {
  expect(await runAiSmoke("text", {})).toMatchObject({ status: "PASS", meta: { mode: "fixture" }, realService: "SKIPPED_ENV" });
});
it("skips an unconfigured live image test before preparing or transmitting an image", async () => {
  const result = await runAiSmoke("image", { AI_PROVIDER: "gemini", GEMINI_API_KEY: "private-placeholder" });
  expect(result.status).toBe("SKIPPED_ENV");
  expect(JSON.stringify(result)).not.toContain("private-placeholder");
});
