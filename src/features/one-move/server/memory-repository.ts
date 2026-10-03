import type { CommandAcknowledgement } from "../contracts";
import { DomainError } from "./errors";
import {
  emptyRound,
  type AbortReason,
  type CommandInput,
  type EnsurePlan,
  type ExposurePlan,
  type FinalPlan,
  type InitialPlan,
  type RepositoryMutation,
  type RoundRepository,
  type StartRoundInput,
  type StoredCommand,
  type StoredRound,
  type StoredSession,
} from "./storage";
import { deriveOutcome } from "./outcome";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function commandKey(sessionId: string, commandId: string): string {
  return `${sessionId}:${commandId}`;
}

export class MemoryRoundRepository implements RoundRepository {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly sessionsByCapability = new Map<string, StoredSession>();
  private readonly rounds = new Map<string, StoredRound>();
  private readonly commands = new Map<string, StoredCommand>();
  private readonly exposureKeys = new Set<string>();

  async findSessionByCapabilityHash(capabilityHash: string): Promise<StoredSession | null> {
    const session = this.sessionsByCapability.get(capabilityHash);
    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
    return clone(session);
  }

  async saveSession(session: StoredSession): Promise<void> {
    this.sessions.set(session.id, clone(session));
    this.sessionsByCapability.set(session.capabilityHash, clone(session));
  }

  async startOrResume(input: StartRoundInput): Promise<{ round: StoredRound; created: boolean }> {
    const active = [...this.rounds.values()]
      .filter((round) => round.sessionId === input.session.id && ["choosing", "preparing_move", "awaiting_rechoice"].includes(round.phase))
      .sort((left, right) => right.roundIndex - left.roundIndex)[0];
    if (active) return { round: clone(active), created: false };
    const round = emptyRound(input);
    this.rounds.set(round.id, clone(round));
    return { round: clone(round), created: true };
  }

  async getLatestRound(sessionId: string): Promise<StoredRound | null> {
    const round = [...this.rounds.values()]
      .filter((candidate) => candidate.sessionId === sessionId)
      .sort((left, right) => right.roundIndex - left.roundIndex)[0];
    return round ? clone(round) : null;
  }

  async listRounds(limit: number): Promise<StoredRound[]> {
    return [...this.rounds.values()]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit)
      .map(clone);
  }

  async getRound(sessionId: string, roundId: string): Promise<StoredRound | null> {
    const round = this.rounds.get(roundId);
    if (!round || round.sessionId !== sessionId) return null;
    return clone(round);
  }

  async applyInitial(input: CommandInput & { plan: InitialPlan }): Promise<RepositoryMutation> {
    const round = this.requireRound(input.sessionId, input.roundId);
    const replay = this.replayed(input, "initial");
    if (replay) return replay;
    this.requireRevision(round, input.expectedRevision);
    if (round.phase !== "choosing") throw new DomainError("conflict", "This round is no longer choosing.");
    round.initialBrand = input.plan.initialBrand;
    round.targetBrand = input.plan.targetBrand;
    round.reasonKeys = [...input.plan.reasonKeys];
    round.protectedOther = input.plan.protectedOther;
    round.eligibleCardIds = [...input.plan.eligibleCardIds];
    round.excludedCards = clone(input.plan.excludedCards);
    round.consideredCardIds = [...input.plan.consideredCardIds];
    round.fallbackNote = clone(input.plan.fallbackNote);
    round.selectionPolicy = input.plan.selectionPolicy;
    round.selectionPolicyVersion = input.plan.selectionPolicyVersion;
    round.requestedSelector = input.plan.requestedSelector;
    round.selectionProbability = input.plan.selectionProbability;
    round.assignmentProbabilityMeaning = input.plan.assignmentProbabilityMeaning;
    round.phase = "preparing_move";
    round.revision += 1;
    round.updatedAt = new Date().toISOString();
    return this.commit(input, round, "initial");
  }

  async ensureMove(input: CommandInput & { plan: EnsurePlan }): Promise<RepositoryMutation> {
    const round = this.requireRound(input.sessionId, input.roundId);
    const replay = this.replayed(input, "ensure_move");
    if (replay) return replay;
    if (round.phase === "awaiting_rechoice" && round.note) {
      return this.commit(input, round, "ensure_move");
    }
    this.requireRevision(round, input.expectedRevision);
    if (round.phase !== "preparing_move") throw new DomainError("conflict", "This round is not preparing a move.");
    if (!input.plan.note || !round.fallbackNote) {
      round.phase = "aborted";
      round.abortReason = "no_eligible_move";
      round.endedAt = new Date().toISOString();
      round.revision += 1;
    } else {
      round.note = clone(input.plan.note);
      round.selectorOrigin = input.plan.selectorOrigin;
      round.selectionProbability = input.plan.selectionProbability;
      round.modelId = input.plan.modelId;
      round.promptVersion = input.plan.promptVersion;
      round.noteIssuedAt = new Date().toISOString();
      round.phase = "awaiting_rechoice";
      round.revision += 1;
    }
    round.updatedAt = new Date().toISOString();
    return this.commit(input, round, "ensure_move");
  }

  async recordExposure(input: CommandInput & { plan: ExposurePlan }): Promise<RepositoryMutation> {
    const round = this.requireRound(input.sessionId, input.roundId);
    const replay = this.replayed(input, "exposure");
    if (replay) return replay;
    if (!round.note || round.note.noteHash !== input.plan.noteHash) throw new DomainError("conflict", "The displayed note does not match this round.");
    if (round.phase !== "awaiting_rechoice" && round.phase !== "finished") throw new DomainError("conflict", "The note is not available for exposure.");
    const key = `${round.id}:${input.plan.noteHash}`;
    if (!this.exposureKeys.has(key)) {
      this.exposureKeys.add(key);
      round.exposureNoteHash = input.plan.noteHash;
      round.exposureClientReportedAt = input.plan.clientReportedDisplayedAt;
      round.exposureAcknowledgedAt = new Date().toISOString();
      round.exposureAcknowledgementSource = input.plan.acknowledgementSource;
      round.updatedAt = new Date().toISOString();
    }
    return this.commit(input, round, "exposure");
  }

  async finalize(input: CommandInput & { plan: FinalPlan }): Promise<RepositoryMutation> {
    const round = this.requireRound(input.sessionId, input.roundId);
    const replay = this.replayed(input, "final");
    if (replay) return replay;
    this.requireRevision(round, input.expectedRevision);
    if (round.phase !== "awaiting_rechoice" || !round.initialBrand || !round.targetBrand || !round.note) throw new DomainError("conflict", "This round is not ready for a final choice.");
    if (round.note.noteHash !== input.plan.noteHash) throw new DomainError("conflict", "The note hash does not match the frozen note.");
    if (input.plan.exposureAcknowledgement) {
      if (input.plan.exposureAcknowledgement.noteHash !== round.note.noteHash) throw new DomainError("conflict", "The exposure acknowledgement does not match the frozen note.");
      if (!round.exposureAcknowledgedAt) {
        round.exposureNoteHash = round.note.noteHash;
        round.exposureClientReportedAt = input.plan.exposureAcknowledgement.clientReportedDisplayedAt;
        round.exposureAcknowledgedAt = new Date().toISOString();
        round.exposureAcknowledgementSource = "final_payload";
      }
    }
    round.finalBrand = input.plan.finalBrand;
    const outcome = deriveOutcome(round.initialBrand, input.plan.finalBrand);
    round.switched = outcome.switched;
    round.storyDelta = outcome.storyDelta;
    round.phase = "finished";
    round.endedAt = new Date().toISOString();
    round.revision += 1;
    round.updatedAt = new Date().toISOString();
    return this.commit(input, round, "final");
  }

  async abort(input: CommandInput & { reason: AbortReason }): Promise<RepositoryMutation> {
    const round = this.requireRound(input.sessionId, input.roundId);
    const replay = this.replayed(input, "abort");
    if (replay) return replay;
    this.requireRevision(round, input.expectedRevision);
    if (!["choosing", "preparing_move", "awaiting_rechoice"].includes(round.phase)) throw new DomainError("conflict", "This round is already terminal.");
    round.phase = "aborted";
    round.abortReason = input.reason;
    round.endedAt = new Date().toISOString();
    round.revision += 1;
    round.updatedAt = new Date().toISOString();
    return this.commit(input, round, "abort");
  }

  async startAgain(input: CommandInput & { next: StartRoundInput }): Promise<{ mutation: RepositoryMutation; nextRound: StoredRound }> {
    const oldRound = this.requireRound(input.sessionId, input.roundId);
    const replay = this.replayed(input, "again");
    if (replay) {
      const nextRoundId = this.commands.get(commandKey(input.sessionId, input.commandId))?.resultRoundId;
      const nextRound = nextRoundId ? this.rounds.get(nextRoundId) : undefined;
      if (!nextRound) throw new DomainError("internal_error", "The replayed round is unavailable.", 500);
      return { mutation: replay, nextRound: clone(nextRound) };
    }
    this.requireRevision(oldRound, input.expectedRevision);
    if (oldRound.phase !== "finished" && oldRound.phase !== "aborted") throw new DomainError("conflict", "Finish or leave the current round first.");
    const next = await this.startOrResume(input.next);
    const mutation = this.commit(input, oldRound, "again");
    this.commands.set(commandKey(input.sessionId, input.commandId), { ...this.commands.get(commandKey(input.sessionId, input.commandId))!, resultRoundId: next.round.id });
    return { mutation, nextRound: next.round };
  }

  private requireRound(sessionId: string, roundId: string): StoredRound {
    const round = this.rounds.get(roundId);
    if (!round || round.sessionId !== sessionId) throw new DomainError("not_found", "This round is not available.", 404);
    return round;
  }

  private requireRevision(round: StoredRound, expectedRevision: number): void {
    if (round.revision !== expectedRevision) throw new DomainError("stale_revision", "This street has moved on.", 409);
  }

  private replayed(input: CommandInput, action: string): RepositoryMutation | null {
    const prior = this.commands.get(commandKey(input.sessionId, input.commandId));
    if (!prior) return null;
    if (prior.action !== action || prior.requestHash !== input.requestHash || prior.roundId !== input.roundId) throw new DomainError("conflict", "This command ID was already used for another request.");
    const round = this.rounds.get(prior.roundId);
    if (!round) throw new DomainError("internal_error", "The acknowledged round is unavailable.", 500);
    return { round, acknowledgement: this.ack(input.commandId, action, true), replayed: true };
  }

  private commit(input: CommandInput, round: StoredRound, action: string): RepositoryMutation {
    const stored = clone(round);
    this.rounds.set(round.id, stored);
    const command: StoredCommand = {
      sessionId: input.sessionId,
      roundId: input.roundId,
      commandId: input.commandId,
      action,
      requestHash: input.requestHash,
      createdAt: new Date().toISOString(),
    };
    this.commands.set(commandKey(input.sessionId, input.commandId), command);
    return { round: clone(stored), acknowledgement: this.ack(input.commandId, action, false), replayed: false };
  }

  private ack(commandId: string, action: string, replayed: boolean): CommandAcknowledgement {
    return { commandId, action, replayed };
  }
}
