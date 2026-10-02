import { createServer, type Server } from "node:http";
import { afterEach, expect, it } from "vitest";
import { runDatabaseSmoke } from "./smoke";

let server: Server | undefined;
afterEach(async () => { if (server) { server.closeAllConnections(); await new Promise<void>((resolve) => server!.close(() => resolve())); server = undefined; } });
async function databaseApi(failRead = false, failDelete = false, failInsert = false) {
  const requests: { method: string; url: string; body: string }[] = [];
  let inserted: Record<string, unknown>;
  server = createServer(async (request, response) => {
    let body = ""; for await (const chunk of request) body += chunk;
    requests.push({ method: request.method!, url: request.url!, body });
    response.setHeader("content-type", "application/json");
    if (request.method === "POST") { inserted = JSON.parse(body); response.statusCode = failInsert ? 500 : 201; response.end(failInsert ? '{"message":"private database details"}' : ""); }
    else if (request.method === "GET") { response.statusCode = failRead ? 500 : 200; response.end(failRead ? '{"message":"private database details"}' : JSON.stringify(inserted)); }
    else { response.statusCode = failDelete ? 500 : 200; response.end(failDelete ? '{"message":"private database details"}' : JSON.stringify([inserted])); }
  });
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const address = server.address(); if (!address || typeof address === "string") throw new Error("Test address unavailable.");
  const transport: typeof fetch = (url, init) => fetch(new URL(new URL(String(url)).pathname + new URL(String(url)).search, `http://127.0.0.1:${address.port}`), init);
  return { requests, transport };
}
const config = { ENABLE_DB_SMOKE: "true", SUPABASE_URL: "https://authorized.supabase.co", SUPABASE_PROJECT_REF: "authorized", SUPABASE_SECRET_KEY: "dummy-test-key" };
it("inserts, checks and deletes only the record from this run", async () => {
  const api = await databaseApi();
  expect(await runDatabaseSmoke(config, api.transport)).toEqual({ status: "PASS", cleanup: "PASS" });
  const row = JSON.parse(api.requests[0].body);
  expect(row.payload).toEqual({ purpose: "preparation-connectivity", isPersonal: false });
  expect(api.requests.map((request) => request.method)).toEqual(["POST", "GET", "DELETE"]);
  expect(api.requests[1].url).toContain(`id=eq.${row.id}`);
  expect(api.requests[2].url).toContain(`run_id=eq.${row.run_id}`);
});
it.each([
  [true, false, false, "Database read or record validation failed.", "PASS"],
  [false, true, false, "Database check passed, but cleanup failed.", "FAIL"],
  [false, false, true, "Database insert failed.", "PASS"],
])("attempts cleanup and preserves a safe failure report", async (failRead, failDelete, failInsert, reason, cleanup) => {
  const api = await databaseApi(Boolean(failRead), Boolean(failDelete), Boolean(failInsert));
  const result = await runDatabaseSmoke(config, api.transport);
  expect(result).toEqual({ status: "FAIL", reason, cleanup });
  expect(api.requests.at(-1)?.method).toBe("DELETE");
  expect(JSON.stringify(result)).not.toContain("private database details");
});
it("does not contact a database without the explicit configuration gate", async () => {
  expect(await runDatabaseSmoke({}, async () => { throw new Error("Unexpected database request"); })).toMatchObject({ status: "SKIPPED_ENV" });
});
