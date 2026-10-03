import type { BrandId, PlayerNote, ProductPlacement, PublicProduct, PublicProductFact, ReasonKey, SourceReference } from "../contracts";

export type { BrandId, NotePatch, ProductPlacement, PublicProductFact, ReasonKey, SourceReference } from "../contracts";

export type LocalStage = "welcome" | "pick" | "why" | "note_wait" | "note_reveal" | "pick_again" | "result";

export type ResultKind = "switch" | "stay" | "aborted" | "no_cards";

export type ProductFact = PublicProductFact;

export interface ShopperProduct extends Omit<PublicProduct, "facts" | "sources"> {
  pricePence: number;
  facts: readonly ProductFact[];
  sources: readonly SourceReference[];
}

export type ShopperNote = PlayerNote;

export interface RehearsalStorage {
  version: 1;
  roundId: string;
  stage: LocalStage;
  placement: ProductPlacement;
  selectedBrand: BrandId | null;
  initialBrand: BrandId | null;
  reasonKeys: ReasonKey[];
  otherReason: string;
  note: ShopperNote | null;
  exposureReported: boolean;
  pendingFinalBrand: BrandId | null;
  finalBrand: BrandId | null;
  resultKind: ResultKind | null;
  finalCommandId: string | null;
  saveError: boolean;
  failureUsed: boolean;
}

export interface RecordedStorage {
  version: 1;
  roundId: string;
  stage: LocalStage;
  selectedBrand: BrandId | null;
  pendingFinalBrand: BrandId | null;
  saveError: boolean;
  initialCommandId: string;
  ensureCommandId: string;
  exposureCommandId: string;
  finalCommandId: string;
  abortCommandId: string;
  againCommandId: string;
  exposureDisplayedAt: string | null;
}

export type NoteExposurePayload = {
  roundId: string;
  noteHash: string;
  clientReportedDisplayedAt: string;
};
