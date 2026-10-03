import "server-only";
import { randomUUID } from "node:crypto";
import type {
  AbortRequest,
  AgainRequest,
  CommandResult,
  EnsureMoveRequest,
  ExposureRequest,
  FinalRequest,
  InitialRequest,
  NoteOrigin,
  PlayerState,
  StartRequest,
  StartResult,
} from "../contracts";
import { playerStateSchema } from "../contracts";
import { createBaselineSnapshot } from "./baseline";
import { readOneMoveConfig, type OneMoveConfig } from "./config";
import { DomainError } from "./errors";
import { computeEligibility, makePlayerNote, renderCard } from "./evidence";
import { selectCuratedCard, SELECTION_POLICY_VERSION } from "./selection-policy";
import type { StoredSession } from "./storage";
import { toPlayerState, type AbortReason, type CommandInput, type RoundRepository } from "./storage";
import { deriveTarget } from "./outcome";
import { sha256 } from "./hashing";

function commandHash(action: string, payload: unknown): string {
  if (payload && typeof payload === "object") {
    const semanticPayload = Object.fromEntries(Object.entries(payload as Record<string, unknown>).filter(([key]) => key !== "commandId" && key !== "expectedRevision"));
    return sha256({ action, payload: semanticPayload });
  }
  return sha256({ action, payload });
}

function commandInput(session: StoredSession, roundId: string, commandId: string, expectedRevision: number, action: string, payload: unknown): CommandInput {
  return { sessionId: session.id, roundId, commandId, expectedRevision, requestHash: commandHash(action, payload) };
}

function withOrigin<T extends { origin: NoteOrigin }>(note: T, origin: NoteOrigin): T {
  return { ...note, origin };
}

function safeState(round: Parameters<typeof toPlayerState>[0]): PlayerState {
  return playerStateSchema.parse(toPlayerState(round));
}

export class RoundService {
  constructor(private readonly repository: RoundRepository, private readonly config: OneMoveConfig = readOneMoveConfig()) {}

  async start(session: StoredSession, request: StartRequest = {}): Promise<StartResult> {
    const campaignId = request.campaignId ?? this.config.campaignId;
    if (campaignId !== this.config.campaignId) throw new DomainError("invalid_request", "This campaign is not available.", 422);
    const latest = await this.repository.getLatestRound(session.id);
    const roundId = randomUUID();
    const start = await this.repository.startOrResume({
      session,
      roundId,
      campaignId,
      roundIndex: (latest?.roundIndex ?? 0) + 1,
      isReplay: Boolean(latest),
      evidenceMode: "recorded_pilot",
      baseline: createBaselineSnapshot(roundId, campaignId),
    });
    return { state: safeState(start.round), created: start.created };
  }

  async state(session: StoredSession, roundId: string): Promise<PlayerState> {
    const round = await this.requireRound(session, roundId);
    return safeState(round);
  }

  async initial(session: StoredSession, roundId: string, request: InitialRequest): Promise<CommandResult> {
    const round = await this.requireRound(session, roundId);
    const targetBrand = deriveTarget(request.initialBrand);
    const eligibility = computeEligibility(targetBrand, round.baseline.pricesPence);
    const selection = selectCuratedCard(eligibility.eligible, request.reasonKeys);
    const fallbackNote = selection ? makePlayerNote(renderCard(selection.card, round.baseline.pricesPence), "curated") : null;
    const mutation = await this.repository.applyInitial({
      ...commandInput(session, roundId, request.commandId, request.expectedRevision, "initial", request),
      plan: {
        initialBrand: request.initialBrand,
        targetBrand,
        reasonKeys: [...request.reasonKeys],
        protectedOther: request.other?.trim() || null,
        eligibleCardIds: eligibility.eligible.map((card) => card.id),
        excludedCards: eligibility.excluded,
        consideredCardIds: eligibility.considered,
        fallbackNote,
        selectionPolicy: this.config.movePolicy,
        selectionPolicyVersion: SELECTION_POLICY_VERSION,
        requestedSelector: this.config.selector,
        selectionProbability: selection ? 1 : null,
        assignmentProbabilityMeaning: selection ? "conditional deterministic assignment; not switch confidence" : "no eligible assignment",
      },
    });
    return { acknowledgement: mutation.acknowledgement, state: safeState(mutation.round) };
  }

  async ensureMove(session: StoredSession, roundId: string, request: EnsureMoveRequest): Promise<CommandResult> {
    const round = await this.requireRound(session, roundId);
    const fallback = round.fallbackNote;
    const selectorOrigin = this.config.selector === "curated" ? "curated" : "curated_unavailable";
    const noteOrigin: NoteOrigin = this.config.selector === "curated" ? "curated" : "curated_fallback";
    const note = fallback ? withOrigin(fallback, noteOrigin) : null;
    const mutation = await this.repository.ensureMove({
      ...commandInput(session, roundId, request.commandId, request.expectedRevision, "ensure_move", request),
      plan: {
        note,
        selectorOrigin,
        selectionProbability: note ? 1 : null,
        modelId: null,
        promptVersion: null,
      },
    });
    return { acknowledgement: mutation.acknowledgement, state: safeState(mutation.round) };
  }

  async exposure(session: StoredSession, roundId: string, request: ExposureRequest): Promise<CommandResult> {
    const round = await this.requireRound(session, roundId);
    const mutation = await this.repository.recordExposure({
      ...commandInput(session, roundId, request.commandId, round.revision, "exposure", request),
      plan: {
        noteHash: request.noteHash,
        clientReportedDisplayedAt: request.clientReportedDisplayedAt,
        acknowledgementSource: "exposure_endpoint",
      },
    });
    return { acknowledgement: mutation.acknowledgement, state: safeState(mutation.round) };
  }

  async final(session: StoredSession, roundId: string, request: FinalRequest): Promise<CommandResult> {
    const mutation = await this.repository.finalize({
      ...commandInput(session, roundId, request.commandId, request.expectedRevision, "final", request),
      plan: {
        finalBrand: request.finalBrand,
        noteHash: request.noteHash,
        exposureAcknowledgement: request.exposureAcknowledgement
          ? {
              noteHash: request.exposureAcknowledgement.noteHash,
              clientReportedDisplayedAt: request.exposureAcknowledgement.clientReportedDisplayedAt,
              acknowledgementSource: "final_payload",
            }
          : null,
      },
    });
    return { acknowledgement: mutation.acknowledgement, state: safeState(mutation.round) };
  }

  async abort(session: StoredSession, roundId: string, request: AbortRequest): Promise<CommandResult> {
    const mutation = await this.repository.abort({
      ...commandInput(session, roundId, request.commandId, request.expectedRevision, "abort", request),
      reason: request.reason as AbortReason,
    });
    return { acknowledgement: mutation.acknowledgement, state: safeState(mutation.round) };
  }

  async again(session: StoredSession, roundId: string, request: AgainRequest): Promise<CommandResult> {
    const oldRound = await this.requireRound(session, roundId);
    const nextRoundId = randomUUID();
    const next = {
      session,
      roundId: nextRoundId,
      campaignId: oldRound.campaignId,
      roundIndex: oldRound.roundIndex + 1,
      isReplay: true,
      evidenceMode: oldRound.evidenceMode,
      baseline: createBaselineSnapshot(nextRoundId, oldRound.campaignId),
    } as const;
    const result = await this.repository.startAgain({
      ...commandInput(session, roundId, request.commandId, request.expectedRevision, "again", request),
      next,
    });
    return { acknowledgement: result.mutation.acknowledgement, state: safeState(result.nextRound) };
  }

  private async requireRound(session: StoredSession, roundId: string) {
    const round = await this.repository.getRound(session.id, roundId);
    if (!round) throw new DomainError("not_found", "This round is not available.", 404);
    return round;
  }
}

export function makeRoundService(repository: RoundRepository, config?: OneMoveConfig): RoundService {
  return new RoundService(repository, config);
}
