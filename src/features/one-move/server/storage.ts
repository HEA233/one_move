import type {
  BrandId,
  CommandAcknowledgement,
  EvidenceMode,
  PlayerNote,
  PlayerState,
  ProductPlacement,
  ReasonKey,
  SelectionOrigin,
  ServerPhase,
} from "../contracts";
import type { BaselineSnapshot } from "./baseline";
import type { CardExclusion } from "./evidence";

export type AbortReason = "user_left" | "no_eligible_move" | "technical_error" | "expired";
export type RequestedSelector = "curated" | "live" | "randomised";

export interface StoredSession {
  id: string;
  capabilityHash: string;
  createdAt: string;
  expiresAt: string;
}

export interface StoredRound {
  id: string;
  sessionId: string;
  campaignId: string;
  roundIndex: number;
  isReplay: boolean;
  evidenceMode: EvidenceMode;
  protocolVersion: string;
  revision: number;
  phase: ServerPhase;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  baseline: BaselineSnapshot;
  initialBrand: BrandId | null;
  targetBrand: BrandId | null;
  reasonKeys: ReasonKey[];
  protectedOther: string | null;
  eligibleCardIds: string[];
  excludedCards: CardExclusion[];
  consideredCardIds: string[];
  selectionPolicy: string;
  selectionPolicyVersion: string;
  requestedSelector: RequestedSelector;
  selectorOrigin: SelectionOrigin | null;
  selectionProbability: number | null;
  assignmentProbabilityMeaning: string | null;
  modelId: string | null;
  promptVersion: string | null;
  fallbackNote: PlayerNote | null;
  note: PlayerNote | null;
  noteIssuedAt: string | null;
  exposureNoteHash: string | null;
  exposureClientReportedAt: string | null;
  exposureAcknowledgedAt: string | null;
  exposureAcknowledgementSource: "exposure_endpoint" | "final_payload" | null;
  finalBrand: BrandId | null;
  switched: boolean | null;
  storyDelta: 10 | -10 | null;
  abortReason: AbortReason | null;
}

export interface StoredCommand {
  sessionId: string;
  roundId: string;
  resultRoundId?: string;
  commandId: string;
  action: string;
  requestHash: string;
  createdAt: string;
}

export interface CommandInput {
  sessionId: string;
  roundId: string;
  commandId: string;
  expectedRevision: number;
  requestHash: string;
}

export interface InitialPlan {
  initialBrand: BrandId;
  targetBrand: BrandId;
  reasonKeys: ReasonKey[];
  protectedOther: string | null;
  eligibleCardIds: string[];
  excludedCards: CardExclusion[];
  consideredCardIds: string[];
  fallbackNote: PlayerNote | null;
  selectionPolicy: string;
  selectionPolicyVersion: string;
  requestedSelector: RequestedSelector;
  selectionProbability: number | null;
  assignmentProbabilityMeaning: string;
}

export interface EnsurePlan {
  note: PlayerNote | null;
  selectorOrigin: SelectionOrigin;
  selectionProbability: number | null;
  modelId: string | null;
  promptVersion: string | null;
}

export interface ExposurePlan {
  noteHash: string;
  clientReportedDisplayedAt: string;
  acknowledgementSource: "exposure_endpoint" | "final_payload";
}

export interface FinalPlan {
  finalBrand: BrandId;
  noteHash: string;
  exposureAcknowledgement: ExposurePlan | null;
}

export interface RepositoryMutation {
  round: StoredRound;
  acknowledgement: CommandAcknowledgement;
  replayed: boolean;
}

export interface StartRoundInput {
  session: StoredSession;
  roundId: string;
  campaignId: string;
  roundIndex: number;
  isReplay: boolean;
  evidenceMode: EvidenceMode;
  baseline: BaselineSnapshot;
}

export interface RoundRepository {
  findSessionByCapabilityHash(capabilityHash: string): Promise<StoredSession | null>;
  saveSession(session: StoredSession): Promise<void>;
  startOrResume(input: StartRoundInput): Promise<{ round: StoredRound; created: boolean }>;
  getLatestRound(sessionId: string): Promise<StoredRound | null>;
  listRounds(limit: number): Promise<StoredRound[]>;
  getRound(sessionId: string, roundId: string): Promise<StoredRound | null>;
  applyInitial(input: CommandInput & { plan: InitialPlan }): Promise<RepositoryMutation>;
  ensureMove(input: CommandInput & { plan: EnsurePlan }): Promise<RepositoryMutation>;
  recordExposure(input: CommandInput & { plan: ExposurePlan }): Promise<RepositoryMutation>;
  finalize(input: CommandInput & { plan: FinalPlan }): Promise<RepositoryMutation>;
  abort(input: CommandInput & { reason: AbortReason }): Promise<RepositoryMutation>;
  startAgain(input: CommandInput & { next: StartRoundInput }): Promise<{ mutation: RepositoryMutation; nextRound: StoredRound }>;
}

export function emptyRound(input: StartRoundInput): StoredRound {
  const now = new Date().toISOString();
  return {
    id: input.roundId,
    sessionId: input.session.id,
    campaignId: input.campaignId,
    roundIndex: input.roundIndex,
    isReplay: input.isReplay,
    evidenceMode: input.evidenceMode,
    protocolVersion: "2.0",
    revision: 0,
    phase: "choosing",
    createdAt: now,
    updatedAt: now,
    endedAt: null,
    baseline: input.baseline,
    initialBrand: null,
    targetBrand: null,
    reasonKeys: [],
    protectedOther: null,
    eligibleCardIds: [],
    excludedCards: [],
    consideredCardIds: [],
    selectionPolicy: "contextual_v2",
    selectionPolicyVersion: "contextual_v2",
    requestedSelector: "curated",
    selectorOrigin: null,
    selectionProbability: null,
    assignmentProbabilityMeaning: null,
    modelId: null,
    promptVersion: null,
    fallbackNote: null,
    note: null,
    noteIssuedAt: null,
    exposureNoteHash: null,
    exposureClientReportedAt: null,
    exposureAcknowledgedAt: null,
    exposureAcknowledgementSource: null,
    finalBrand: null,
    switched: null,
    storyDelta: null,
    abortReason: null,
  };
}

export function toPlayerState(round: StoredRound): PlayerState {
  return {
    protocolVersion: round.protocolVersion,
    campaignId: round.campaignId,
    roundId: round.id,
    roundIndex: round.roundIndex,
    isReplay: round.isReplay,
    evidenceMode: round.evidenceMode,
    revision: round.revision,
    phase: round.phase,
    placement: round.baseline.placement satisfies ProductPlacement,
    products: round.baseline.products,
    pricesPence: round.baseline.pricesPence,
    initialBrand: round.initialBrand,
    targetBrand: round.targetBrand,
    reasonKeys: round.reasonKeys,
    note: round.note,
    exposure: {
      issuedAt: round.noteIssuedAt,
      clientReportedDisplayedAt: round.exposureClientReportedAt,
      acknowledgedAt: round.exposureAcknowledgedAt,
      acknowledgementSource: round.exposureAcknowledgementSource,
    },
    finalBrand: round.finalBrand,
    switched: round.switched,
    storyDelta: round.storyDelta,
    abortReason: round.abortReason,
  };
}
