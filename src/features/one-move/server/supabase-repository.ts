import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BrandId, EvidenceMode, SelectionOrigin, ServerPhase } from "../contracts";
import { DomainError } from "./errors";
import type {
  AbortReason,
  CommandInput,
  EnsurePlan,
  ExposurePlan,
  FinalPlan,
  InitialPlan,
  RepositoryMutation,
  RoundRepository,
  StartRoundInput,
  StoredRound,
  StoredSession,
} from "./storage";
import type { OneMoveConfig } from "./config";

type SupabaseRow = Record<string, unknown>;

function text(row: SupabaseRow, key: string): string {
  const value = row[key];
  if (typeof value !== "string") throw new Error(`Database row is missing ${key}.`);
  return value;
}

function optionalText(row: SupabaseRow, key: string): string | null {
  const value = row[key];
  return value === null || value === undefined ? null : text(row, key);
}

function timestamp(row: SupabaseRow, key: string): string {
  return new Date(text(row, key)).toISOString();
}

function optionalTimestamp(row: SupabaseRow, key: string): string | null {
  const value = row[key];
  return value === null || value === undefined ? null : new Date(text(row, key)).toISOString();
}

function number(row: SupabaseRow, key: string): number {
  const value = row[key];
  if (typeof value !== "number") throw new Error(`Database row is missing numeric ${key}.`);
  return value;
}

function json<T>(row: SupabaseRow, key: string, fallback: T): T {
  return (row[key] ?? fallback) as T;
}

function requiredJson<T>(row: SupabaseRow, key: string): T {
  if (row[key] === null || row[key] === undefined) throw new Error(`Database row is missing ${key}.`);
  return row[key] as T;
}

function bool(row: SupabaseRow, key: string): boolean {
  return row[key] === true;
}

function rowToSession(row: SupabaseRow): StoredSession {
  return {
    id: text(row, "id"),
    capabilityHash: text(row, "capability_hash"),
    createdAt: timestamp(row, "created_at"),
    expiresAt: timestamp(row, "expires_at"),
  };
}

export function rowToRound(row: SupabaseRow): StoredRound {
  return {
    id: text(row, "id"),
    sessionId: text(row, "session_id"),
    campaignId: text(row, "campaign_id"),
    roundIndex: number(row, "round_index"),
    isReplay: bool(row, "is_replay"),
    evidenceMode: text(row, "evidence_mode") as EvidenceMode,
    protocolVersion: text(row, "protocol_version"),
    revision: number(row, "revision"),
    phase: text(row, "phase") as ServerPhase,
    createdAt: timestamp(row, "created_at"),
    updatedAt: timestamp(row, "updated_at"),
    endedAt: optionalTimestamp(row, "ended_at"),
    baseline: requiredJson(row, "baseline_snapshot"),
    initialBrand: optionalText(row, "initial_brand") as BrandId | null,
    targetBrand: optionalText(row, "target_brand") as BrandId | null,
    reasonKeys: json(row, "reason_keys", []),
    protectedOther: optionalText(row, "other_reason"),
    eligibleCardIds: json(row, "eligible_card_ids", []),
    excludedCards: json(row, "excluded_cards", []),
    consideredCardIds: json(row, "considered_card_ids", []),
    selectionPolicy: text(row, "selection_policy"),
    selectionPolicyVersion: text(row, "selection_policy_version"),
    requestedSelector: text(row, "requested_selector") as StoredRound["requestedSelector"],
    selectorOrigin: optionalText(row, "selector_origin") as SelectionOrigin | null,
    selectionProbability: row["selection_probability"] === null || row["selection_probability"] === undefined ? null : Number(row["selection_probability"]),
    assignmentProbabilityMeaning: optionalText(row, "assignment_probability_meaning"),
    modelId: optionalText(row, "model_id"),
    promptVersion: optionalText(row, "prompt_version"),
    fallbackNote: json(row, "fallback_note", null),
    note: json(row, "selected_note", null),
    noteIssuedAt: optionalTimestamp(row, "note_issued_at"),
    exposureNoteHash: optionalText(row, "exposure_note_hash"),
    exposureClientReportedAt: optionalTimestamp(row, "exposure_client_reported_at"),
    exposureAcknowledgedAt: optionalTimestamp(row, "exposure_acknowledged_at"),
    exposureAcknowledgementSource: optionalText(row, "exposure_acknowledgement_source") as StoredRound["exposureAcknowledgementSource"],
    finalBrand: optionalText(row, "final_brand") as BrandId | null,
    switched: row["switched"] === null || row["switched"] === undefined ? null : Boolean(row["switched"]),
    storyDelta: row["story_delta"] === null || row["story_delta"] === undefined ? null : Number(row["story_delta"]) as 10 | -10,
    abortReason: optionalText(row, "abort_reason") as AbortReason | null,
  };
}

function errorFromSupabase(message: string): DomainError {
  if (message.includes("command_conflict")) return new DomainError("conflict", "This command ID was already used for another request.");
  if (message.includes("stale_revision")) return new DomainError("stale_revision", "This street has moved on.");
  if (message.includes("not_found")) return new DomainError("not_found", "This round is not available.", 404);
  if (message.includes("unauthorised")) return new DomainError("unauthorised", "This round is not available.", 401);
  if (message.includes("conflict")) return new DomainError("conflict", "This round cannot accept that command.");
  return new DomainError("unavailable", "The saved round is temporarily unavailable.", 503);
}

export class SupabaseRoundRepository implements RoundRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findSessionByCapabilityHash(capabilityHash: string): Promise<StoredSession | null> {
    const result = await this.client.from("om_sessions").select("*").eq("capability_hash", capabilityHash).maybeSingle();
    if (result.error) throw errorFromSupabase(result.error.message);
    return result.data ? rowToSession(result.data as SupabaseRow) : null;
  }

  async saveSession(session: StoredSession): Promise<void> {
    const result = await this.client.from("om_sessions").upsert({
      id: session.id,
      capability_hash: session.capabilityHash,
      created_at: session.createdAt,
      expires_at: session.expiresAt,
    });
    if (result.error) throw errorFromSupabase(result.error.message);
  }

  async startOrResume(input: StartRoundInput): Promise<{ round: StoredRound; created: boolean }> {
    const result = await this.rpc("om_start_round", {
      p_session_id: input.session.id,
      p_round_id: input.roundId,
      p_campaign_id: input.campaignId,
      p_round_index: input.roundIndex,
      p_is_replay: input.isReplay,
      p_evidence_mode: input.evidenceMode,
      p_protocol_version: "2.0",
      p_baseline_snapshot: input.baseline,
    });
    const payload = result as { round: SupabaseRow; created: boolean };
    return { round: rowToRound(payload.round), created: payload.created === true };
  }

  async getLatestRound(sessionId: string): Promise<StoredRound | null> {
    const result = await this.client.from("om_rounds").select("*").eq("session_id", sessionId).order("round_index", { ascending: false }).limit(1).maybeSingle();
    if (result.error) throw errorFromSupabase(result.error.message);
    return result.data ? rowToRound(result.data as SupabaseRow) : null;
  }

  async listRounds(limit: number): Promise<StoredRound[]> {
    const result = await this.client.from("om_rounds").select("*").order("created_at", { ascending: false }).limit(limit);
    if (result.error) throw errorFromSupabase(result.error.message);
    return (result.data ?? []).map((row) => rowToRound(row as SupabaseRow));
  }

  async getRound(sessionId: string, roundId: string): Promise<StoredRound | null> {
    const result = await this.client.from("om_rounds").select("*").eq("session_id", sessionId).eq("id", roundId).maybeSingle();
    if (result.error) throw errorFromSupabase(result.error.message);
    return result.data ? rowToRound(result.data as SupabaseRow) : null;
  }

  async applyInitial(input: CommandInput & { plan: InitialPlan }): Promise<RepositoryMutation> {
    return this.mutation("om_initial", {
      p_session_id: input.sessionId,
      p_round_id: input.roundId,
      p_command_id: input.commandId,
      p_expected_revision: input.expectedRevision,
      p_request_hash: input.requestHash,
      p_plan: input.plan,
    }, "initial");
  }

  async ensureMove(input: CommandInput & { plan: EnsurePlan }): Promise<RepositoryMutation> {
    return this.mutation("om_ensure_move", {
      p_session_id: input.sessionId,
      p_round_id: input.roundId,
      p_command_id: input.commandId,
      p_expected_revision: input.expectedRevision,
      p_request_hash: input.requestHash,
      p_plan: input.plan,
    }, "ensure_move");
  }

  async recordExposure(input: CommandInput & { plan: ExposurePlan }): Promise<RepositoryMutation> {
    return this.mutation("om_exposure", {
      p_session_id: input.sessionId,
      p_round_id: input.roundId,
      p_command_id: input.commandId,
      p_request_hash: input.requestHash,
      p_plan: input.plan,
    }, "exposure");
  }

  async finalize(input: CommandInput & { plan: FinalPlan }): Promise<RepositoryMutation> {
    return this.mutation("om_final", {
      p_session_id: input.sessionId,
      p_round_id: input.roundId,
      p_command_id: input.commandId,
      p_expected_revision: input.expectedRevision,
      p_request_hash: input.requestHash,
      p_plan: input.plan,
    }, "final");
  }

  async abort(input: CommandInput & { reason: AbortReason }): Promise<RepositoryMutation> {
    return this.mutation("om_abort", {
      p_session_id: input.sessionId,
      p_round_id: input.roundId,
      p_command_id: input.commandId,
      p_expected_revision: input.expectedRevision,
      p_request_hash: input.requestHash,
      p_reason: input.reason,
    }, "abort");
  }

  async startAgain(input: CommandInput & { next: StartRoundInput }): Promise<{ mutation: RepositoryMutation; nextRound: StoredRound }> {
    const result = await this.rpc("om_again", {
      p_session_id: input.sessionId,
      p_round_id: input.roundId,
      p_command_id: input.commandId,
      p_expected_revision: input.expectedRevision,
      p_request_hash: input.requestHash,
      p_next_round_id: input.next.roundId,
      p_next_round_index: input.next.roundIndex,
      p_next_campaign_id: input.next.campaignId,
      p_next_evidence_mode: input.next.evidenceMode,
      p_next_baseline_snapshot: input.next.baseline,
    }) as { old_round: SupabaseRow; next_round: SupabaseRow; replayed: boolean };
    return {
      mutation: {
        round: rowToRound(result.old_round),
        acknowledgement: { commandId: input.commandId, action: "again", replayed: result.replayed === true },
        replayed: result.replayed === true,
      },
      nextRound: rowToRound(result.next_round),
    };
  }

  private async mutation(functionName: string, args: Record<string, unknown>, action: string): Promise<RepositoryMutation> {
    const payload = await this.rpc(functionName, args) as { round: SupabaseRow; replayed: boolean; command_id?: string };
    const commandId = typeof payload.command_id === "string" ? payload.command_id : String(args.p_command_id);
    const replayed = payload.replayed === true;
    return {
      round: rowToRound(payload.round),
      acknowledgement: { commandId, action, replayed },
      replayed,
    };
  }

  private async rpc(functionName: string, args: Record<string, unknown>): Promise<unknown> {
    const result = await this.client.rpc(functionName, args);
    if (result.error) throw errorFromSupabase(result.error.message);
    return result.data;
  }
}

export function createSupabaseRoundRepository(config: OneMoveConfig): SupabaseRoundRepository {
  if (!config.supabaseUrl || !config.supabaseSecretKey) throw new DomainError("unavailable", "Saved rounds are not configured.", 503);
  const client = createClient(config.supabaseUrl, config.supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { "x-one-move-server": "true" } },
  });
  return new SupabaseRoundRepository(client);
}
