import { describe, expect, it } from "vitest";
import { assertSameOrigin } from "./http";

describe("same-origin mutation guard", () => {
  it("accepts the origin represented by the request host", () => {
    expect(() => assertSameOrigin(new Request("http://localhost:3100/api/play/start", { headers: { origin: "http://127.0.0.1:3100", host: "127.0.0.1:3100" } }))).not.toThrow();
  });

  it("rejects a different origin", () => {
    expect(() => assertSameOrigin(new Request("http://localhost:3100/api/play/start", { headers: { origin: "https://attacker.example", host: "localhost:3100" } }))).toThrow(/same-origin/i);
  });
});
