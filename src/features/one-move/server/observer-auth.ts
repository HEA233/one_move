import "server-only";
import { timingSafeEqual } from "node:crypto";
import { readOneMoveConfig } from "./config";
import { DomainError } from "./errors";

function sameSecret(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireObserver(request: Request): void {
  const config = readOneMoveConfig();
  if (!config.observerEnabled || !config.observerAccessKey) throw new DomainError("not_found", "This view is not available.", 404);
  const header = request.headers.get("authorization");
  const supplied = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : request.headers.get("x-observer-key");
  if (!supplied || !sameSecret(supplied, config.observerAccessKey)) throw new DomainError("unauthorised", "This view is not available.", 401);
}
