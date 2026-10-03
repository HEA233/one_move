import type { BrandId, PlayerNote, ReasonKey, ServerPhase } from "../contracts";
import type { StoredRound } from "../server/storage";

export interface ObserverRoundSummary {
  roundId: string;
  roundIndex: number;
  evidenceMode: StoredRound["evidenceMode"];
  isReplay: boolean;
  phase: ServerPhase;
  initialBrand: BrandId | null;
  targetBrand: BrandId | null;
  reasonKeys: ReasonKey[];
  eligibleCardIds: string[];
  excludedCards: StoredRound["excludedCards"];
  consideredCardIds: string[];
  selectionPolicy: string;
  selectionPolicyVersion: string;
  requestedSelector: StoredRound["requestedSelector"];
  selectorOrigin: StoredRound["selectorOrigin"];
  selectedCardId: string | null;
  note: PlayerNote | null;
  finalBrand: BrandId | null;
  switched: boolean | null;
  storyDelta: 10 | -10 | null;
  exposureAcknowledged: boolean;
}

export function toObserverRound(round: StoredRound): ObserverRoundSummary {
  return {
    roundId: round.id,
    roundIndex: round.roundIndex,
    evidenceMode: round.evidenceMode,
    isReplay: round.isReplay,
    phase: round.phase,
    initialBrand: round.initialBrand,
    targetBrand: round.targetBrand,
    reasonKeys: round.reasonKeys.filter((key) => key !== "other"),
    eligibleCardIds: [...round.eligibleCardIds],
    excludedCards: round.excludedCards,
    consideredCardIds: [...round.consideredCardIds],
    selectionPolicy: round.selectionPolicy,
    selectionPolicyVersion: round.selectionPolicyVersion,
    requestedSelector: round.requestedSelector,
    selectorOrigin: round.selectorOrigin,
    selectedCardId: round.note?.cardId ?? null,
    note: round.note,
    finalBrand: round.finalBrand,
    switched: round.switched,
    storyDelta: round.storyDelta,
    exposureAcknowledged: round.exposureAcknowledgedAt !== null,
  };
}
