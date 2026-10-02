import { mkdir, writeFile } from "node:fs/promises";
import { aiSmokeConfiguration } from "../config/environment";
import { imageSmokeInput, textSmokeInput } from "./fixtures";
import { createModelProvider, type ModelInput, type ModelMetadata } from "./provider";

type SmokeResult = { status: "PASS"; meta: ModelMetadata; realService: "PASS" | "SKIPPED_ENV" } | { status: "SKIPPED_ENV" | "FAIL"; reason: string };
async function runInput<T>(input: ModelInput<T>, provider: ReturnType<typeof createModelProvider>): Promise<SmokeResult> {
  const result = await provider.generate(input);
  if (JSON.stringify(result.data) !== JSON.stringify(input.fixture)) return { status: "FAIL", reason: "Structured result did not match the fixed smoke expectations." };
  return { status: "PASS", meta: result.meta, realService: result.meta.mode === "fixture" ? "SKIPPED_ENV" : "PASS" };
}
export async function runAiSmoke(kind: "text" | "image", environment: Record<string, string | undefined>): Promise<SmokeResult> {
  try {
    const readiness = aiSmokeConfiguration(environment);
    if (readiness.status === "skipped") return { status: "SKIPPED_ENV", reason: readiness.reason };
    const provider = createModelProvider(readiness.config);
    if (kind === "text") return await runInput(textSmokeInput, provider);
    const { chromium } = await import("@playwright/test");
    let browser;
    try { browser = await chromium.launch({ headless: true }); }
    catch { return { status: "SKIPPED_ENV", reason: "Chromium is unavailable for the synthetic image fixture. Run npx playwright install chromium." }; }
    let png: Buffer;
    try {
      const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
      await page.setContent('<html><body style="margin:0;padding:32px;font:24px Arial;background:white;color:black"><h1>TEST FIXTURE</h1><p>Quantity: 2 pieces</p><p>Batch: A17</p></body></html>');
      png = await page.screenshot({ type: "png" });
      await mkdir(".local", { recursive: true });
      await writeFile(".local/ai-image-fixture.png", png);
    } catch { return { status: "FAIL", reason: "Could not prepare the synthetic image fixture." }; }
    finally { await browser.close(); }
    return await runInput({ ...imageSmokeInput, image: { mimeType: "image/png", data: png.toString("base64") } }, provider);
  } catch (error) {
    // Configuration and provider errors are deliberately reduced to safe messages.
    return { status: "FAIL", reason: error instanceof Error ? error.message : "AI smoke failed." };
  }
}
