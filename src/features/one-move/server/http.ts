import { DomainError, publicError } from "./errors";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    if (process.env.NODE_ENV === "production") throw new DomainError("invalid_request", "A same-origin request is required.", 400);
    return;
  }
  let requestOrigin: string;
  try {
    const requestUrl = new URL(request.url);
    requestOrigin = requestUrl.origin;
    const suppliedOrigin = new URL(origin).origin;
    const forwardedProtocol = request.headers.get("x-forwarded-proto");
    const host = request.headers.get("host");
    const hostOrigin = host ? `${forwardedProtocol === "https" ? "https" : requestUrl.protocol}//${host}` : requestOrigin;
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : requestOrigin;
    if (suppliedOrigin !== configuredOrigin && suppliedOrigin !== requestOrigin && suppliedOrigin !== hostOrigin) throw new DomainError("invalid_request", "A same-origin request is required.", 400);
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError("invalid_request", "A same-origin request is required.", 400);
  }
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) throw new DomainError("invalid_request", "JSON is required.", 400);
  try {
    return await request.json();
  } catch {
    throw new DomainError("invalid_request", "The request could not be read.", 400);
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}

export function errorResponse(error: unknown): Response {
  const safe = publicError(error);
  return jsonResponse({ error: { code: safe.code, message: safe.message } }, safe.status);
}
