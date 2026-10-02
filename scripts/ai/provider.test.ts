import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
let createModelProvider: typeof import("./provider").createModelProvider;
beforeEach(async () => { vi.resetModules(); ({ createModelProvider } = await import("./provider")); });

const schema = z.strictObject({ item: z.string(), quantity: z.number().int(), price: z.number().nullable() });
const input = { text: "Item: Example notebook. Quantity: 2. No price is provided.", jsonSchema: z.toJSONSchema(schema), validator: schema, fixture: { item: "Example notebook", quantity: 2, price: null }, promptVersion: "text-v1", schemaVersion: "v1" };
let server: Server | undefined;
afterEach(async () => { if (server) { server.closeAllConnections(); await new Promise<void>((resolve) => server!.close(() => resolve())); server = undefined; } });
async function localApi(status: number, text: string, hang = false) {
  const requests: { body: string }[] = [];
  server = createServer(async (request, response) => {
    let body = ""; for await (const chunk of request) body += chunk;
    requests.push({ body });
    if (hang) return;
    response.writeHead(status, { "content-type": "application/json" });
    response.end(status === 200 ? JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text }] } }], usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 9 } }) : JSON.stringify({ error: { code: status, message: "sensitive upstream details", status: "ERROR" } }));
  });
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server address unavailable.");
  const origin = `http://127.0.0.1:${address.port}`;
  const transport: typeof fetch = (url, init) => fetch(new URL(new URL(String(url)).pathname, origin), init);
  return { requests, transport };
}

describe("structured model provider", () => {
  it("returns fixture metadata without initializing or contacting Gemini", async () => {
    const provider = createModelProvider({ provider: "mock" }, { transport: async () => { throw new Error("Unexpected external request"); } });
    const result = await provider.generate(input);
    expect(result.data).toEqual({ item: "Example notebook", quantity: 2, price: null });
    expect(result.meta).toMatchObject({ provider: "mock", mode: "fixture", promptVersion: "text-v1", schemaVersion: "v1" });
  });
});

it("validates a real SDK response and sends JSON schema without tools", async () => {
  const api = await localApi(200, '{"item":"Example notebook","quantity":2,"price":null}');
  const provider = createModelProvider({ provider: "gemini", model: "test-model", apiKey: "dummy-test-key" }, { transport: api.transport });
  const result = await provider.generate(input);
  expect(result.data.price).toBeNull();
  expect(result.meta).toMatchObject({ provider: "gemini", mode: "live_developer_test", tokens: { input: 7, output: 9 } });
  const request = JSON.parse(api.requests[0].body);
  expect(request.generationConfig).toMatchObject({ responseMimeType: "application/json", maxOutputTokens: 1024 });
  expect(request.generationConfig.responseJsonSchema).toBeDefined();
  expect(request.tools).toBeUndefined();
});

it.each([401, 403, 429])("does not retry HTTP %i or expose upstream details", async (status) => {
  const api = await localApi(status, "");
  const provider = createModelProvider({ provider: "gemini", model: "test-model", apiKey: "dummy-test-key" }, { transport: api.transport });
  await expect(provider.generate(input)).rejects.toThrow(status === 429 ? "Model rate limit exceeded." : "Model authentication failed.");
  expect(api.requests).toHaveLength(1);
});
it.each(["not json", '{"item":"Example notebook","quantity":"two","price":null}'])("rejects invalid output instead of returning a fixture: %s", async (text) => {
  const api = await localApi(200, text);
  const provider = createModelProvider({ provider: "gemini", model: "test-model", apiKey: "dummy-test-key" }, { transport: api.transport });
  await expect(provider.generate(input)).rejects.toThrow(text === "not json" ? "Model returned invalid JSON." : "Model output failed schema validation.");
});
it("cancels a stalled HTTP request at its deadline", async () => {
  const api = await localApi(200, "", true);
  const provider = createModelProvider({ provider: "gemini", model: "test-model", apiKey: "dummy-test-key" }, { transport: api.transport, timeoutMs: 30 });
  await expect(provider.generate(input)).rejects.toThrow("Model request timed out.");
  expect(api.requests).toHaveLength(1);
});
it("enforces the three-request budget across provider instances", async () => {
  const api = await localApi(200, '{"item":"Example notebook","quantity":2,"price":null}');
  const config = { provider: "gemini" as const, model: "test-model", apiKey: "dummy-test-key" };
  const first = createModelProvider(config, { transport: api.transport });
  const second = createModelProvider(config, { transport: api.transport });
  await first.generate(input); await second.generate(input); await first.generate(input);
  await expect(second.generate(input)).rejects.toThrow("Model request budget exhausted.");
  expect(api.requests).toHaveLength(3);
});
it("rejects missing keys and oversized inputs before contacting the provider", async () => {
  const api = await localApi(200, "{}");
  const missing = createModelProvider({ provider: "gemini", model: "test-model", apiKey: "" }, { transport: api.transport });
  await expect(missing.generate(input)).rejects.toThrow("Model configuration is incomplete.");
  const provider = createModelProvider({ provider: "gemini", model: "test-model", apiKey: "dummy-test-key" }, { transport: api.transport });
  await expect(provider.generate({ ...input, text: "x".repeat(4001) })).rejects.toThrow("Model input exceeds the allowed size.");
  expect(api.requests).toHaveLength(0);
});
it("sends an explicit synthetic image with the fixed text extraction schema", async () => {
  const api = await localApi(200, '{"item":"Example notebook","quantity":2,"price":null}');
  const provider = createModelProvider({ provider: "gemini", model: "test-model", apiKey: "dummy-test-key" }, { transport: api.transport });
  await provider.generate({ ...input, image: { mimeType: "image/png", data: "aW1hZ2UtZml4dHVyZQ==" } });
  expect(JSON.parse(api.requests[0].body).contents[0].parts[1]).toEqual({ inlineData: { mimeType: "image/png", data: "aW1hZ2UtZml4dHVyZQ==" } });
});
