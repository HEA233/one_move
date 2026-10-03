import { ZodError } from "zod";
import type { ErrorCode } from "../contracts";

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly status: 400 | 401 | 404 | 409 | 422 | 503 | 500;

  constructor(code: ErrorCode, message: string, status: 400 | 401 | 404 | 409 | 422 | 503 | 500 = 409) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
  }
}

export function publicError(error: unknown): { code: ErrorCode; message: string; status: 400 | 401 | 404 | 409 | 422 | 503 | 500 } {
  if (error instanceof DomainError) return { code: error.code, message: error.message, status: error.status };
  if (error instanceof ZodError) return { code: "invalid_request", message: "The request is not valid.", status: 400 };
  return { code: "internal_error", message: "We couldn't complete that round just now.", status: 500 };
}
