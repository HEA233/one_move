import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { DomainError } from "./errors";
import type { RoundRepository, StoredSession } from "./storage";

export const SESSION_COOKIE = "om_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function hashCapability(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requireSession(repository: RoundRepository): Promise<StoredSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) throw new DomainError("unauthorised", "This round is not available.", 401);
  const session = await repository.findSessionByCapabilityHash(hashCapability(token));
  if (!session) throw new DomainError("unauthorised", "This round is not available.", 401);
  return session;
}

export async function getOrCreateSession(repository: RoundRepository): Promise<{ session: StoredSession; setCookie: (response: Response) => Response }> {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (currentToken) {
    const existing = await repository.findSessionByCapabilityHash(hashCapability(currentToken));
    if (existing) return { session: existing, setCookie: (response) => response };
  }

  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const session: StoredSession = {
    id: randomUUID(),
    capabilityHash: hashCapability(token),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
  };
  await repository.saveSession(session);
  return {
    session,
    setCookie: (response) => {
      response.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Max-Age=${SESSION_MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
      return response;
    },
  };
}
