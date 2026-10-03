"use client";

/* eslint-disable @next/next/no-img-element -- The selected product thumbnail is a local authored crop. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerState } from "../contracts";
import { interpolateCopy, brandName, shopperCopy } from "../copy/copy";
import { StreetScene, type ShopMood, type VisitorPosition } from "../scene/StreetScene";
import { abortRound, createCommandId, ensureMove, getRoundState, OneMoveApiError, reportExposure, startAgain, startRound, submitFinal, submitInitial } from "./client";
import { brandSide, createLocalRoundId, otherBrand, placementForRound, rehearsalNoteFor, rehearsalProducts } from "./rehearsal";
import type { BrandId, LocalStage, ProductPlacement, ReasonKey, RecordedStorage, RehearsalStorage, ResultKind, ShopperNote, ShopperProduct } from "./types";
import { ConnectionNotice } from "../ui/ConnectionNotice";
import { GameShell } from "../ui/GameShell";
import { OneMoveButton } from "../ui/OneMoveButton";
import { ProductCard } from "../ui/ProductCard";
import { ReasonChips } from "../ui/ReasonChips";
import { SourceSheet } from "../ui/SourceSheet";
import styles from "../ui/OneMove.module.css";

const REHEARSAL_STORAGE_KEY = "one-move:rehearsal:active";
const RECORDED_STORAGE_PREFIX = "one-move:recorded:";
const RECORDED_ACTIVE_KEY = "one-move:recorded:active";

type ShopperExperienceProps = {
  roundId?: string;
};

type SheetState =
  | { kind: "product"; product: ShopperProduct }
  | { kind: "note"; note: ShopperNote };

type DemoMode = "normal" | "save-error" | "offline" | "no-card";

type RecordedCommands = Pick<RecordedStorage, "initialCommandId" | "ensureCommandId" | "exposureCommandId" | "finalCommandId" | "abortCommandId" | "againCommandId" | "exposureDisplayedAt">;

function isBrandId(value: unknown): value is BrandId {
  return value === "charitea_mate_can" || value === "oom_balance";
}

function isStage(value: unknown): value is LocalStage {
  return value === "welcome" || value === "pick" || value === "why" || value === "note_wait" || value === "note_reveal" || value === "pick_again" || value === "result";
}

function isResultKind(value: unknown): value is ResultKind {
  return value === "switch" || value === "stay" || value === "aborted" || value === "no_cards";
}

function readRehearsalStorage(roundId: string | undefined): RehearsalStorage | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(REHEARSAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RehearsalStorage>;
    if (parsed.version !== 1 || typeof parsed.roundId !== "string" || (roundId && parsed.roundId !== roundId) || !isStage(parsed.stage)) return null;
    if (!parsed.placement || !isBrandId(parsed.placement.left) || !isBrandId(parsed.placement.right)) return null;
    if (parsed.selectedBrand !== null && parsed.selectedBrand !== undefined && !isBrandId(parsed.selectedBrand)) return null;
    if (parsed.initialBrand !== null && parsed.initialBrand !== undefined && !isBrandId(parsed.initialBrand)) return null;
    if (parsed.finalBrand !== null && parsed.finalBrand !== undefined && !isBrandId(parsed.finalBrand)) return null;
    if (parsed.resultKind !== null && parsed.resultKind !== undefined && !isResultKind(parsed.resultKind)) return null;
    if (!Array.isArray(parsed.reasonKeys) || !Array.isArray(parsed.note ? parsed.note.sourceIds : [])) return null;
    return {
      version: 1,
      roundId: parsed.roundId,
      stage: parsed.stage,
      placement: parsed.placement,
      selectedBrand: parsed.selectedBrand ?? null,
      initialBrand: parsed.initialBrand ?? null,
      reasonKeys: parsed.reasonKeys as ReasonKey[],
      otherReason: typeof parsed.otherReason === "string" ? parsed.otherReason : "",
      note: parsed.note ?? null,
      exposureReported: parsed.exposureReported === true,
      pendingFinalBrand: parsed.pendingFinalBrand && isBrandId(parsed.pendingFinalBrand) ? parsed.pendingFinalBrand : null,
      finalBrand: parsed.finalBrand ?? null,
      resultKind: parsed.resultKind ?? null,
      finalCommandId: typeof parsed.finalCommandId === "string" ? parsed.finalCommandId : null,
      saveError: parsed.saveError === true,
      failureUsed: parsed.failureUsed === true,
    };
  } catch {
    return null;
  }
}

function readRecordedStorage(roundId: string): RecordedStorage | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(`${RECORDED_STORAGE_PREFIX}${roundId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RecordedStorage>;
    if (parsed.version !== 1 || parsed.roundId !== roundId || !isStage(parsed.stage)) return null;
    return {
      version: 1,
      roundId,
      stage: parsed.stage,
      selectedBrand: parsed.selectedBrand && isBrandId(parsed.selectedBrand) ? parsed.selectedBrand : null,
      pendingFinalBrand: parsed.pendingFinalBrand && isBrandId(parsed.pendingFinalBrand) ? parsed.pendingFinalBrand : null,
      saveError: parsed.saveError === true,
      initialCommandId: typeof parsed.initialCommandId === "string" ? parsed.initialCommandId : createCommandId(),
      ensureCommandId: typeof parsed.ensureCommandId === "string" ? parsed.ensureCommandId : createCommandId(),
      exposureCommandId: typeof parsed.exposureCommandId === "string" ? parsed.exposureCommandId : createCommandId(),
      finalCommandId: typeof parsed.finalCommandId === "string" ? parsed.finalCommandId : createCommandId(),
      abortCommandId: typeof parsed.abortCommandId === "string" ? parsed.abortCommandId : createCommandId(),
      againCommandId: typeof parsed.againCommandId === "string" ? parsed.againCommandId : createCommandId(),
      exposureDisplayedAt: typeof parsed.exposureDisplayedAt === "string" ? parsed.exposureDisplayedAt : null,
    };
  } catch {
    return null;
  }
}

function createRecordedCommands(): RecordedCommands {
  return {
    initialCommandId: createCommandId(),
    ensureCommandId: createCommandId(),
    exposureCommandId: createCommandId(),
    finalCommandId: createCommandId(),
    abortCommandId: createCommandId(),
    againCommandId: createCommandId(),
    exposureDisplayedAt: null,
  };
}

function shopperProductsFromState(state: PlayerState): readonly ShopperProduct[] {
  return state.products.map((product) => ({
    ...product,
    pricePence: state.pricesPence[product.id],
    facts: product.facts,
    sources: product.sources,
  }));
}

function orderedShopperProducts(products: readonly ShopperProduct[], placement: ProductPlacement): readonly ShopperProduct[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  return [byId.get(placement.left), byId.get(placement.right)].filter((product): product is ShopperProduct => Boolean(product));
}

function resultKindFromState(state: PlayerState): ResultKind | null {
  if (state.phase === "aborted") return state.abortReason === "no_eligible_move" ? "no_cards" : "aborted";
  if (state.phase !== "finished" || state.finalBrand === null || state.switched === null) return null;
  return state.switched ? "switch" : "stay";
}

function stageFromState(state: PlayerState, savedStage?: LocalStage): LocalStage {
  if (state.phase === "choosing") return "pick";
  if (state.phase === "preparing_move") return "note_wait";
  if (state.phase === "awaiting_rechoice") return savedStage === "pick_again" ? "pick_again" : "note_reveal";
  return "result";
}

function hasReducedMotionPreference(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ShopperExperience({ roundId: addressedRoundId }: ShopperExperienceProps) {
  const router = useRouter();
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const ensureInFlightRef = useRef(false);
  const exposureInFlightRef = useRef(false);
  const abortInFlightRef = useRef(false);
  const exposureAttemptRef = useRef<string | null>(null);
  const retryActionRef = useRef<(() => void) | null>(null);
  const [roundId, setRoundId] = useState<string | null>(addressedRoundId ?? null);
  const [stage, setStage] = useState<LocalStage>("welcome");
  const [placement, setPlacement] = useState<ProductPlacement>(() => placementForRound(addressedRoundId ?? "rehearsal"));
  const [products, setProducts] = useState<readonly ShopperProduct[]>(rehearsalProducts);
  const [selectedBrand, setSelectedBrand] = useState<BrandId | null>(null);
  const [initialBrand, setInitialBrand] = useState<BrandId | null>(null);
  const [reasonKeys, setReasonKeys] = useState<ReasonKey[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [note, setNote] = useState<ShopperNote | null>(null);
  const [exposureReported, setExposureReported] = useState(false);
  const [exposureDisplayedAt, setExposureDisplayedAt] = useState<string | null>(null);
  const [pendingFinalBrand, setPendingFinalBrand] = useState<BrandId | null>(null);
  const [finalBrand, setFinalBrand] = useState<BrandId | null>(null);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [finalCommandId, setFinalCommandId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [failureUsed, setFailureUsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submittingInitial, setSubmittingInitial] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string>(shopperCopy.reconnecting);
  const [demoMode, setDemoMode] = useState<DemoMode>("normal");
  const [rehearsalMode, setRehearsalMode] = useState(false);
  const [serverState, setServerState] = useState<PlayerState | null>(null);
  const [recordedCommands, setRecordedCommands] = useState<RecordedCommands>(() => createRecordedCommands());
  const [loadingRound, setLoadingRound] = useState(Boolean(addressedRoundId));
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const stageRef = useRef<LocalStage>("welcome");
  stageRef.current = stage;

  useEffect(() => {
    setReducedMotion(hasReducedMotionPreference());
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handlePreferenceChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", handlePreferenceChange);
    return () => query.removeEventListener("change", handlePreferenceChange);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const requestedMode = searchParams.get("rehearsal");
    const explicitRehearsal = searchParams.has("rehearsal");
    setRehearsalMode(explicitRehearsal);
    if (requestedMode === "save-error" || requestedMode === "offline" || requestedMode === "no-card") setDemoMode(requestedMode);
    setConnectionIssue(explicitRehearsal && requestedMode === "offline");

    if (explicitRehearsal) {
      const stored = readRehearsalStorage(addressedRoundId);
      if (stored) {
        setRoundId(stored.roundId);
        setStage(stored.stage);
        setPlacement(stored.placement);
        setSelectedBrand(stored.selectedBrand);
        setInitialBrand(stored.initialBrand);
        setReasonKeys(stored.reasonKeys);
        setOtherReason(stored.otherReason);
        setNote(stored.note);
        setExposureReported(stored.exposureReported);
        setPendingFinalBrand(stored.pendingFinalBrand);
        setFinalBrand(stored.finalBrand);
        setResultKind(stored.resultKind);
        setFinalCommandId(stored.finalCommandId);
        setSaveError(stored.saveError);
        setFailureUsed(stored.failureUsed);
      }
      setLoadingRound(false);
      setHydrated(true);
      return;
    }

    const resumableRoundId = addressedRoundId ?? window.localStorage.getItem(RECORDED_ACTIVE_KEY);
    if (!resumableRoundId) {
      setLoadingRound(false);
      setHydrated(true);
      return;
    }

    const stored = readRecordedStorage(resumableRoundId);
    if (stored) {
      setStage(stored.stage);
      setSelectedBrand(stored.selectedBrand);
      setPendingFinalBrand(stored.pendingFinalBrand);
      setSaveError(stored.saveError);
      setRecordedCommands({
        initialCommandId: stored.initialCommandId,
        ensureCommandId: stored.ensureCommandId,
        exposureCommandId: stored.exposureCommandId,
        finalCommandId: stored.finalCommandId,
        abortCommandId: stored.abortCommandId,
        againCommandId: stored.againCommandId,
        exposureDisplayedAt: stored.exposureDisplayedAt,
      });
      setExposureDisplayedAt(stored.exposureDisplayedAt);
    }
    setLoadingRound(true);
    setHydrated(true);
    void loadRecordedState(resumableRoundId, stored?.stage).catch(() => undefined);
  }, [addressedRoundId]);

  useEffect(() => {
    if (!hydrated || !roundId) return;
    if (rehearsalMode) {
      const record: RehearsalStorage = {
        version: 1,
        roundId,
        stage,
        placement,
        selectedBrand,
        initialBrand,
        reasonKeys,
        otherReason,
        note,
        exposureReported,
        pendingFinalBrand,
        finalBrand,
        resultKind,
        finalCommandId,
        saveError,
        failureUsed,
      };
      window.localStorage.setItem(REHEARSAL_STORAGE_KEY, JSON.stringify(record));
      return;
    }
    if (!serverState || loadingRound) return;
    const record: RecordedStorage = {
      version: 1,
      roundId,
      stage,
      selectedBrand,
      pendingFinalBrand,
      saveError,
      ...recordedCommands,
    };
    window.localStorage.setItem(`${RECORDED_STORAGE_PREFIX}${roundId}`, JSON.stringify(record));
    window.localStorage.setItem(RECORDED_ACTIVE_KEY, roundId);
  }, [hydrated, rehearsalMode, roundId, stage, placement, selectedBrand, initialBrand, reasonKeys, otherReason, note, exposureReported, pendingFinalBrand, finalBrand, resultKind, finalCommandId, saveError, failureUsed, serverState, loadingRound, recordedCommands]);

  useEffect(() => {
    if (!rehearsalMode || stage !== "note_wait") return;
    const timer = window.setTimeout(() => {
      if (note) {
        setStage("note_reveal");
      } else {
        setResultKind("no_cards");
        setStage("result");
      }
    }, reducedMotion ? 0 : 720);
    return () => window.clearTimeout(timer);
  }, [rehearsalMode, stage, note, reducedMotion]);

  useEffect(() => {
    if (stage !== "note_reveal" || !note || !roundId || exposureReported) return;
    if (rehearsalMode) {
      setExposureReported(true);
      return;
    }
    const attemptKey = `${roundId}:${note.noteHash}`;
    if (exposureAttemptRef.current === attemptKey) return;
    exposureAttemptRef.current = attemptKey;
    const displayedAt = exposureDisplayedAt ?? new Date().toISOString();
    setExposureDisplayedAt(displayedAt);
    void sendRecordedExposure(roundId, note, displayedAt);
  }, [stage, note, roundId, exposureReported, rehearsalMode, exposureDisplayedAt]);

  const targetBrand = initialBrand ? otherBrand(initialBrand) : null;
  const ordered = orderedShopperProducts(products, placement);
  const visibleNote = stage === "note_reveal" || stage === "pick_again" || stage === "result" ? note : null;
  const visitorPosition = getVisitorPosition(stage, resultKind, finalBrand, initialBrand, placement);
  const envelopeTarget = (stage === "note_wait" || stage === "note_reveal") && note ? brandSide(placement, note.targetBrand) : null;
  const moodByBrand = getMood(resultKind, initialBrand, targetBrand);

  function applyRecordedState(next: PlayerState, savedStage?: LocalStage) {
    setServerState(next);
    setRoundId(next.roundId);
    setPlacement(next.placement);
    setProducts(shopperProductsFromState(next));
    setSelectedBrand(next.phase === "choosing" ? null : next.initialBrand);
    setInitialBrand(next.initialBrand);
    setReasonKeys([...next.reasonKeys]);
    setNote(next.note);
    setExposureReported(next.exposure.acknowledgedAt !== null);
    setExposureDisplayedAt(next.exposure.clientReportedDisplayedAt);
    setFinalBrand(next.finalBrand);
    setResultKind(resultKindFromState(next));
    if (next.phase === "finished" || next.phase === "aborted") {
      setPendingFinalBrand(null);
      setSaveError(false);
    }
    setStage(stageFromState(next, savedStage));
  }

  async function loadRecordedState(nextRoundId: string, savedStage?: LocalStage) {
    setLoadingRound(true);
    try {
      const next = await getRoundState(nextRoundId);
      applyRecordedState(next, savedStage);
      setLoadingRound(false);
      if (next.phase === "preparing_move") await ensureRecordedMove(next);
    } catch (error) {
      setLoadingRound(false);
      showApiError(error, () => void loadRecordedState(nextRoundId, savedStage));
    }
  }

  function showApiError(error: unknown, retry: () => void) {
    if (error instanceof OneMoveApiError && error.state) applyRecordedState(error.state, stage);
    setConnectionMessage(error instanceof OneMoveApiError ? error.message : shopperCopy.reconnecting);
    setConnectionIssue(true);
    retryActionRef.current = retry;
  }

  async function ensureRecordedMove(current: PlayerState) {
    if (ensureInFlightRef.current) return;
    ensureInFlightRef.current = true;
    try {
      const result = await ensureMove(current.roundId, { commandId: recordedCommands.ensureCommandId, expectedRevision: current.revision });
      applyRecordedState(result.state, result.state.note ? "note_reveal" : "result");
      setConnectionIssue(false);
      retryActionRef.current = null;
    } catch (error) {
      showApiError(error, () => void ensureRecordedMove(current));
    } finally {
      ensureInFlightRef.current = false;
    }
  }

  async function sendRecordedExposure(nextRoundId: string, nextNote: ShopperNote, displayedAt: string) {
    if (exposureInFlightRef.current) return;
    exposureInFlightRef.current = true;
    try {
      const result = await reportExposure(nextRoundId, {
        commandId: recordedCommands.exposureCommandId,
        noteHash: nextNote.noteHash,
        clientReportedDisplayedAt: displayedAt,
      });
      applyRecordedState(result.state, stageRef.current === "pick_again" ? "pick_again" : "note_reveal");
      setConnectionIssue(false);
      retryActionRef.current = null;
    } catch (error) {
      showApiError(error, () => void sendRecordedExposure(nextRoundId, nextNote, displayedAt));
    } finally {
      exposureInFlightRef.current = false;
    }
  }

  function ensureRound(): string {
    if (roundId) return roundId;
    const nextRoundId = createLocalRoundId();
    setRoundId(nextRoundId);
    setPlacement(placementForRound(nextRoundId));
    return nextRoundId;
  }

  async function beginRound() {
    if (!hydrated || loadingRound) return;
    retryActionRef.current = null;
    setConnectionIssue(false);
    if (rehearsalMode) {
      ensureRound();
      setStage("pick");
      return;
    }
    setLoadingRound(true);
    try {
      const next = await startRound();
      setRecordedCommands(createRecordedCommands());
      window.localStorage.setItem(RECORDED_ACTIVE_KEY, next.roundId);
      applyRecordedState(next);
      setLoadingRound(false);
      if (next.phase === "preparing_move") void ensureRecordedMove(next);
    } catch (error) {
      setLoadingRound(false);
      showApiError(error, () => void beginRound());
    }
  }

  async function commitInitial(nextReasons: ReasonKey[], nextOtherReason: string) {
    if (!selectedBrand || (rehearsalMode && connectionIssue) || submittingInitial) return;
    const chosenBrand = selectedBrand;
    const nextTarget = otherBrand(chosenBrand);
    setReasonKeys(nextReasons);
    setOtherReason(nextOtherReason);
    setResultKind(null);
    setConnectionIssue(false);

    if (rehearsalMode) {
      setInitialBrand(chosenBrand);
      setNote(demoMode === "no-card" ? null : rehearsalNoteFor(nextTarget));
      setExposureReported(false);
      setStage("note_wait");
      return;
    }

    if (!serverState || serverState.phase !== "choosing" || !roundId) return;
    setSubmittingInitial(true);
    try {
      const result = await submitInitial(roundId, {
        commandId: recordedCommands.initialCommandId,
        expectedRevision: serverState.revision,
        initialBrand: chosenBrand,
        reasonKeys: nextReasons,
        ...(nextOtherReason.trim() ? { other: nextOtherReason } : {}),
      });
      applyRecordedState(result.state, "note_wait");
      await ensureRecordedMove(result.state);
    } catch (error) {
      showApiError(error, () => void commitInitial(nextReasons, nextOtherReason));
    } finally {
      setSubmittingInitial(false);
    }
  }

  function retryConnection() {
    const retry = retryActionRef.current;
    retryActionRef.current = null;
    setConnectionIssue(false);
    if (retry) void retry();
  }

  async function leaveRound() {
    if (saving || submittingInitial || abortInFlightRef.current) return;
    if (rehearsalMode) {
      ensureRound();
      setSaveError(false);
      setPendingFinalBrand(null);
      setResultKind("aborted");
      setStage("result");
      return;
    }
    if (!serverState || !roundId) return;
    if (serverState.phase === "finished" || serverState.phase === "aborted") {
      finishExperience();
      return;
    }
    abortInFlightRef.current = true;
    try {
      const result = await abortRound(roundId, {
        commandId: recordedCommands.abortCommandId,
        expectedRevision: serverState.revision,
        reason: "user_left",
      });
      applyRecordedState(result.state, "result");
      setConnectionIssue(false);
    } catch (error) {
      showApiError(error, () => void leaveRound());
    } finally {
      abortInFlightRef.current = false;
    }
  }

  async function finalChoice(choice: BrandId) {
    if (!initialBrand || stage !== "pick_again" || saving) return;
    if (!rehearsalMode && (!serverState || !roundId || !note || serverState.phase !== "awaiting_rechoice")) return;
    const commandId = rehearsalMode ? finalCommandId ?? createLocalRoundId() : recordedCommands.finalCommandId;
    setFinalCommandId(commandId);
    setPendingFinalBrand(choice);
    setSaveError(false);
    setSaving(true);
    if (rehearsalMode) {
      window.setTimeout(() => {
        setSaving(false);
        if (demoMode === "save-error" && !failureUsed) {
          setFailureUsed(true);
          setSaveError(true);
          return;
        }
        setFinalBrand(choice);
        setPendingFinalBrand(null);
        setResultKind(choice === otherBrand(initialBrand) ? "switch" : "stay");
        setStage("result");
      }, reducedMotion ? 0 : 260);
      return;
    }

    const displayedAt = exposureDisplayedAt ?? serverState?.exposure.clientReportedDisplayedAt ?? null;
    try {
      const result = await submitFinal(roundId!, {
        commandId,
        expectedRevision: serverState!.revision,
        finalBrand: choice,
        noteHash: note!.noteHash,
        ...(exposureReported || !displayedAt ? {} : {
          exposureAcknowledgement: { noteHash: note!.noteHash, clientReportedDisplayedAt: displayedAt },
        }),
      });
      applyRecordedState(result.state, "result");
      setPendingFinalBrand(null);
      setSaveError(false);
      setConnectionIssue(false);
    } catch (error) {
      if (error instanceof OneMoveApiError && error.state) applyRecordedState(error.state, "pick_again");
      setSaveError(true);
      setConnectionMessage(error instanceof OneMoveApiError ? error.message : shopperCopy.saveError);
      retryActionRef.current = null;
    } finally {
      setSaving(false);
    }
  }

  function retryFinalChoice() {
    if (pendingFinalBrand) void finalChoice(pendingFinalBrand);
  }

  async function startNewRound() {
    if (rehearsalMode) {
      const nextRoundId = createLocalRoundId();
      setRoundId(nextRoundId);
      setPlacement(placementForRound(nextRoundId));
      setProducts(rehearsalProducts);
      setSelectedBrand(null);
      setInitialBrand(null);
      setReasonKeys([]);
      setOtherReason("");
      setNote(null);
      setExposureReported(false);
      setExposureDisplayedAt(null);
      setPendingFinalBrand(null);
      setFinalBrand(null);
      setResultKind(null);
      setFinalCommandId(null);
      setSaveError(false);
      setFailureUsed(false);
      setConnectionIssue(false);
      setStage("pick");
      return;
    }
    if (!serverState || !roundId || (serverState.phase !== "finished" && serverState.phase !== "aborted")) return;
    setLoadingRound(true);
    try {
      const result = await startAgain(roundId, {
        commandId: recordedCommands.againCommandId,
        expectedRevision: serverState.revision,
      });
      setRecordedCommands(createRecordedCommands());
      window.localStorage.setItem(RECORDED_ACTIVE_KEY, result.state.roundId);
      setPendingFinalBrand(null);
      setSaveError(false);
      setConnectionIssue(false);
      applyRecordedState(result.state, "pick");
      setLoadingRound(false);
    } catch (error) {
      setLoadingRound(false);
      showApiError(error, () => void startNewRound());
    }
  }

  function finishExperience() {
    if (roundId) {
      window.localStorage.removeItem(`${RECORDED_STORAGE_PREFIX}${roundId}`);
      if (rehearsalMode) window.localStorage.removeItem(REHEARSAL_STORAGE_KEY);
    }
    window.localStorage.removeItem(RECORDED_ACTIVE_KEY);
    setRoundId(null);
    setPlacement(placementForRound("rehearsal"));
    setProducts(rehearsalProducts);
    setServerState(null);
    setSelectedBrand(null);
    setInitialBrand(null);
    setReasonKeys([]);
    setOtherReason("");
    setNote(null);
    setExposureReported(false);
    setExposureDisplayedAt(null);
    setPendingFinalBrand(null);
    setFinalBrand(null);
    setResultKind(null);
    setFinalCommandId(null);
    setSaveError(false);
    setFailureUsed(false);
    setConnectionIssue(false);
    setRecordedCommands(createRecordedCommands());
    setStage("welcome");
    router.replace("/play");
  }

  function openProductDetails(product: ShopperProduct, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger;
    setSheet({ kind: "product", product });
  }

  function openNoteSource(nextNote: ShopperNote, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger;
    setSheet({ kind: "note", note: nextNote });
  }

  const onHome = stage === "welcome" ? undefined : stage === "result" ? finishExperience : leaveRound;
  const panelClassName = `${styles.panel}${stage === "pick" || stage === "pick_again" ? ` ${styles.panelWithPinnedAction}` : ""}`;

  return (
    <GameShell onHome={onHome} badge={rehearsalMode ? shopperCopy.rehearsalBadge : null}>
      <div className={styles.gameFrame}>
        <div className={styles.sceneFrame}>
          <StreetScene
            products={products}
            placement={placement}
            visitorPosition={visitorPosition}
            envelopeTarget={envelopeTarget}
            moodByBrand={moodByBrand}
          />
        </div>
        <section className={panelClassName} aria-live="polite">
          {connectionIssue ? <ConnectionNotice message={connectionMessage} onRetry={retryConnection} /> : null}
          {stage === "welcome" ? (
            <div className={styles.panelInner}>
              <p className={styles.kicker}>Human Truth</p>
              <h1>{shopperCopy.welcomeTitle}</h1>
              <p className={styles.helper}>{shopperCopy.welcomeBody}</p>
              <p className={styles.consent}>{shopperCopy.consent}</p>
              <p className={styles.priceDisclosure}>{shopperCopy.priceDisclosure}</p>
              {rehearsalMode ? <p className={styles.badgeNote}>{shopperCopy.rehearsalBadge}</p> : null}
              <div className={styles.actions}>
                <OneMoveButton disabled={loadingRound} onClick={() => void beginRound()}>{shopperCopy.start}</OneMoveButton>
              </div>
            </div>
          ) : stage === "pick" ? (
            <div className={styles.panelInner}>
              <p className={styles.kicker}>A small choice</p>
              <h1>{shopperCopy.pickTitle}</h1>
              <p className={styles.helper}>{shopperCopy.pickHelper}</p>
              <p className={styles.priceDisclosure}>{shopperCopy.priceDisclosure}</p>
              <div className={styles.productGrid}>
                {ordered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selected={selectedBrand === product.id}
                    compact
                    onChoose={setSelectedBrand}
                    onDetails={openProductDetails}
                  />
                ))}
              </div>
              <div className={`${styles.actions} ${styles.mobileActionBar}`}>
                <OneMoveButton className={styles.buttonWide} disabled={!selectedBrand} onClick={() => setStage("why")}>
                  {shopperCopy.pickConfirm}
                </OneMoveButton>
              </div>
              <OneMoveButton variant="quiet" className={styles.leaveButton} onClick={() => void leaveRound()}>{shopperCopy.leave}</OneMoveButton>
            </div>
          ) : stage === "why" ? (
            <div className={styles.panelInner}>
              <p className={styles.kicker}>A couple of clues</p>
              <h1>{shopperCopy.whyTitle}</h1>
              <p className={styles.helper}>{shopperCopy.whyHelper}</p>
              {selectedBrand ? (
                <div className={styles.selectedSummary}>
                  <img src={products.find((product) => product.id === selectedBrand)?.imageSrc} alt="" />
                  <p>{brandName(selectedBrand)}</p>
                </div>
              ) : null}
              <ReasonChips selected={reasonKeys} otherText={otherReason} onChange={setReasonKeys} onOtherTextChange={setOtherReason} />
              <div className={styles.actions}>
                <OneMoveButton className={styles.buttonWide} disabled={submittingInitial} onClick={() => void commitInitial(reasonKeys, otherReason)}>{shopperCopy.whySend}</OneMoveButton>
                <OneMoveButton className={styles.buttonWide} variant="secondary" disabled={submittingInitial} onClick={() => void commitInitial([], "")}>{shopperCopy.whySkip}</OneMoveButton>
              </div>
              <OneMoveButton variant="quiet" className={styles.leaveButton} onClick={() => void leaveRound()}>{shopperCopy.leave}</OneMoveButton>
            </div>
          ) : stage === "note_wait" ? (
            <div className={`${styles.panelInner} ${styles.waitPanel}`}>
              <div className={styles.waitMark} aria-hidden="true">✉</div>
              <h1>{shopperCopy.waitTitle}</h1>
              <p className={styles.helper}>{shopperCopy.waitHelper}</p>
              <p className={styles.slowNote}>{shopperCopy.slowNote}</p>
              <OneMoveButton variant="quiet" className={styles.leaveButton} onClick={() => void leaveRound()}>{shopperCopy.leave}</OneMoveButton>
            </div>
          ) : stage === "note_reveal" ? (
            <div className={styles.panelInner}>
              <h1>{shopperCopy.revealTitle}</h1>
              {note ? (
                <div className={styles.revealNote} data-testid="note-reveal">
                  <div className={styles.noteSender}>
                    <img src={products.find((product) => product.id === note.targetBrand)?.imageSrc} alt="" />
                    <span>{brandName(note.targetBrand)}</span>
                  </div>
                  <p className={styles.noteIntro}>{note.patch.kind === "price" ? shopperCopy.revealPriceIntro : shopperCopy.revealIntro}</p>
                  <p className={styles.noteFact}>{note.text}</p>
                  <p className={styles.noteQuestion}>{shopperCopy.revealQuestion}</p>
                </div>
              ) : null}
              {note ? (
                <div className={styles.revealMeta}>
                  <button className={styles.noteSourceButton} type="button" onClick={(event) => openNoteSource(note, event.currentTarget)}>
                    {shopperCopy.revealSource}
                  </button>
                </div>
              ) : null}
              <div className={styles.actions}>
                <OneMoveButton className={styles.buttonWide} onClick={() => setStage("pick_again")}>{shopperCopy.revealNext}</OneMoveButton>
              </div>
              <OneMoveButton variant="quiet" className={styles.leaveButton} onClick={() => void leaveRound()}>{shopperCopy.leave}</OneMoveButton>
            </div>
          ) : stage === "pick_again" ? (
            <div className={styles.panelInner}>
              <p className={styles.kicker}>Your second look</p>
              <h1>{shopperCopy.finalTitle}</h1>
              <p className={styles.helper}>{shopperCopy.finalHelper}</p>
              <div className={styles.productGrid}>
                {ordered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    note={visibleNote?.targetBrand === product.id ? visibleNote : null}
                    showNote={visibleNote?.targetBrand === product.id}
                    onNoteSource={openNoteSource}
                    onDetails={openProductDetails}
                  />
                ))}
              </div>
              {saveError ? <p className={styles.errorMessage} role="alert">{shopperCopy.saveError}</p> : null}
              <div className={`${styles.finalActions} ${styles.mobileActionBar}`}>
                {saveError ? (
                  <OneMoveButton variant="secondary" className={styles.retryAction} onClick={retryFinalChoice}>{shopperCopy.retryChoice}</OneMoveButton>
                ) : (
                  <>
                    {initialBrand ? (
                      <button className={styles.choiceButton} type="button" disabled={saving} onClick={() => void finalChoice(initialBrand)}>
                        {saving && pendingFinalBrand === initialBrand ? shopperCopy.saving : interpolateCopy(shopperCopy.stay, { initialBrand: brandName(initialBrand) })}
                      </button>
                    ) : null}
                    {targetBrand ? (
                      <button className={styles.choiceButton} type="button" disabled={saving} onClick={() => void finalChoice(targetBrand)}>
                        {saving && pendingFinalBrand === targetBrand ? shopperCopy.saving : interpolateCopy(shopperCopy.switch, { targetBrand: brandName(targetBrand) })}
                      </button>
                    ) : null}
                  </>
                )}
              </div>
              <OneMoveButton variant="quiet" className={styles.leaveButton} onClick={() => void leaveRound()}>{shopperCopy.leave}</OneMoveButton>
            </div>
          ) : (
            <ResultPanel
              resultKind={resultKind}
              finalBrand={finalBrand}
              initialBrand={initialBrand}
              targetBrand={targetBrand}
              note={note}
              onNoteSource={openNoteSource}
              onAgain={startNewRound}
              onDone={finishExperience}
            />
          )}
        </section>
      </div>
      {sheet?.kind === "product" ? <SourceSheet product={sheet.product} returnFocusRef={returnFocusRef} onClose={() => setSheet(null)} /> : null}
      {sheet?.kind === "note" ? <SourceSheet note={sheet.note} returnFocusRef={returnFocusRef} onClose={() => setSheet(null)} /> : null}
    </GameShell>
  );
}

function getVisitorPosition(stage: LocalStage, resultKind: ResultKind | null, finalBrand: BrandId | null, initialBrand: BrandId | null, placement: ProductPlacement): VisitorPosition {
  if ((resultKind === "switch" || resultKind === "stay") && finalBrand) return brandSide(placement, finalBrand);
  if ((stage === "note_wait" || stage === "note_reveal" || stage === "pick_again") && initialBrand) return brandSide(placement, initialBrand);
  return "junction";
}

function getMood(resultKind: ResultKind | null, initialBrand: BrandId | null, targetBrand: BrandId | null): Partial<Record<BrandId, ShopMood>> {
  if (resultKind === "switch" && targetBrand) return { [targetBrand]: "warm" };
  if (resultKind === "stay" && targetBrand) return { [targetBrand]: "thoughtful" };
  if (resultKind === "aborted" || resultKind === "no_cards") return {};
  return initialBrand ? { [initialBrand]: "neutral" } : {};
}

type ResultPanelProps = {
  resultKind: ResultKind | null;
  finalBrand: BrandId | null;
  initialBrand: BrandId | null;
  targetBrand: BrandId | null;
  note: ShopperNote | null;
  onNoteSource: (note: ShopperNote, trigger: HTMLButtonElement) => void;
  onAgain: () => void;
  onDone: () => void;
};

function ResultPanel({ resultKind, finalBrand, initialBrand, targetBrand, note, onNoteSource, onAgain, onDone }: ResultPanelProps) {
  const isSwitch = resultKind === "switch";
  const isStay = resultKind === "stay";
  const title = resultKind === "aborted" ? shopperCopy.abortTitle : resultKind === "no_cards" ? shopperCopy.noCardsTitle : isSwitch ? shopperCopy.resultSwitchTitle : shopperCopy.resultStayTitle;
  const body = resultKind === "aborted" ? shopperCopy.abortBody : resultKind === "no_cards" ? shopperCopy.noCardsBody : isSwitch && finalBrand ? interpolateCopy(shopperCopy.resultSwitchBody, { finalBrand: brandName(finalBrand) }) : finalBrand ? interpolateCopy(shopperCopy.resultStayBody, { finalBrand: brandName(finalBrand) }) : shopperCopy.abortBody;

  return (
    <div className={styles.panelInner}>
      <div className={styles.resultPanel}>
        <span className={styles.resultStamp}>{resultKind === "aborted" || resultKind === "no_cards" ? shopperCopy.done : "Choice saved"}</span>
        <h1>{title}</h1>
        <p className={styles.helper}>{body}</p>
        {note && targetBrand && (isSwitch || isStay) ? (
          <div className={styles.revealMeta}>
            <span>{brandName(targetBrand)} note:</span>
            <button className={styles.noteSourceButton} type="button" onClick={(event) => onNoteSource(note, event.currentTarget)}>
              {shopperCopy.revealSource}
            </button>
          </div>
        ) : null}
        {isSwitch || isStay ? (
          <>
            <p className={styles.resultFootnote}>{shopperCopy.resultFootnote}</p>
            <details className={styles.storyTally}>
              <summary>{shopperCopy.diaryLabel}</summary>
              <p>{shopperCopy.diaryScope}</p>
              <p>{isSwitch ? shopperCopy.diarySwitch : shopperCopy.diaryStay}</p>
            </details>
          </>
        ) : null}
        <div className={styles.actions}>
          <OneMoveButton className={styles.buttonWide} onClick={onDone}>{shopperCopy.done}</OneMoveButton>
          <OneMoveButton className={styles.buttonWide} variant="secondary" onClick={onAgain}>{shopperCopy.replay}</OneMoveButton>
        </div>
        <p className={styles.badgeNote}>{shopperCopy.replayNote}</p>
        {initialBrand && targetBrand && resultKind === null ? null : null}
      </div>
    </div>
  );
}
