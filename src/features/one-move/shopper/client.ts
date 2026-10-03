"use client";

import type {
  AbortRequest,
  AgainRequest,
  CommandResult,
  EnsureMoveRequest,
  ExposureRequest,
  FinalRequest,
  InitialRequest,
  PlayerState,
  StartRequest,
} from "../contracts";
import { playerStateSchema } from "../contracts";

type StartResponse = {
  acknowledgement: { action: string; replayed: boolean };
  state: PlayerState;
};

type ErrorBody = {
  error?: { code?: string; message?: string };
  state?: PlayerState;
};

export class OneMoveApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly state: PlayerState | null;

  constructor(message: string, code: string, status: number, state: PlayerState | null = null) {
    super(message);
    this.name = "OneMoveApiError";
    this.code = code;
    this.status = status;
    this.state = state;
  }
}

function stateFromBody(body: { state?: unknown }): PlayerState {
  return playerStateSchema.parse(body.state);
}

async function request<T extends ErrorBody>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new OneMoveApiError("The saved round could not be reached.", "unavailable", 0);
  }

  let body: T;
  try {
    body = (await response.json()) as T;
  } catch {
    throw new OneMoveApiError("The saved round returned an unreadable response.", "internal_error", response.status);
  }

  if (!response.ok) {
    throw new OneMoveApiError(
      body.error?.message ?? "The saved round could not be updated.",
      body.error?.code ?? "unavailable",
      response.status,
      body.state ? playerStateSchema.parse(body.state) : null,
    );
  }

  return body;
}

export function createCommandId(): string {
  const cryptoObject = typeof globalThis.crypto === "undefined" ? null : globalThis.crypto;
  if (cryptoObject && typeof cryptoObject.randomUUID === "function") {
    return cryptoObject.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (cryptoObject) {
    cryptoObject.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function jsonBody(payload: object): RequestInit {
  return { method: "POST", body: JSON.stringify(payload) };
}

export async function startRound(payload: StartRequest = {}): Promise<PlayerState> {
  const result = await request<StartResponse>("/api/play/start", jsonBody(payload));
  return stateFromBody(result);
}

export async function getRoundState(roundId: string): Promise<PlayerState> {
  const result = await request<{ state: PlayerState }>(`/api/play/${roundId}/state`);
  return stateFromBody(result);
}

export async function submitInitial(roundId: string, payload: InitialRequest): Promise<CommandResult> {
  const result = await request<CommandResult>(`/api/play/${roundId}/initial`, jsonBody(payload));
  return { ...result, state: stateFromBody(result) };
}

export async function ensureMove(roundId: string, payload: EnsureMoveRequest): Promise<CommandResult> {
  const result = await request<CommandResult>(`/api/play/${roundId}/move/ensure`, jsonBody(payload));
  return { ...result, state: stateFromBody(result) };
}

export async function reportExposure(roundId: string, payload: ExposureRequest): Promise<CommandResult> {
  const result = await request<CommandResult>(`/api/play/${roundId}/exposure`, jsonBody(payload));
  return { ...result, state: stateFromBody(result) };
}

export async function submitFinal(roundId: string, payload: FinalRequest): Promise<CommandResult> {
  const result = await request<CommandResult>(`/api/play/${roundId}/final`, jsonBody(payload));
  return { ...result, state: stateFromBody(result) };
}

export async function abortRound(roundId: string, payload: AbortRequest): Promise<CommandResult> {
  const result = await request<CommandResult>(`/api/play/${roundId}/abort`, jsonBody(payload));
  return { ...result, state: stateFromBody(result) };
}

export async function startAgain(roundId: string, payload: AgainRequest): Promise<CommandResult> {
  const result = await request<CommandResult>(`/api/play/${roundId}/again`, jsonBody(payload));
  return { ...result, state: stateFromBody(result) };
}
