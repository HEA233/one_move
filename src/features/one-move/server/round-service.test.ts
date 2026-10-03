import { describe, expect, it } from "vitest";
import type { StoredSession } from "./storage";
import { MemoryRoundRepository } from "./memory-repository";
import { RoundService } from "./round-service";
import { toObserverRound } from "../observer/dto";

const session = (id: string): StoredSession => ({
  id,
  capabilityHash: `hash-${id}`,
  createdAt: "2026-10-03T12:00:00.000Z",
  expiresAt: "2026-10-10T12:00:00.000Z",
});

const config = {
  protocolVersion: "2.0" as const,
  campaignId: "one-move-mobile-pilot-v2",
  movePolicy: "contextual_v2" as const,
  selector: "curated" as const,
  liveApproved: false,
  model: null,
  modelKey: null,
  maxCampaignAttempts: 30,
  supabaseUrl: null,
  supabaseSecretKey: null,
  observerEnabled: false,
  observerAccessKey: null,
};

function id(number: number): string {
  return `00000000-0000-4000-8000-${number.toString().padStart(12, "0")}`;
}

describe("ONE MOVE authoritative round service", () => {
  it("completes a switch with one frozen note and one outcome", async () => {
    const repository = new MemoryRoundRepository();
    const service = new RoundService(repository, config);
    const owner = session("00000000-0000-4000-8000-000000000101");
    const started = await service.start(owner, { campaignId: config.campaignId });

    const initial = await service.initial(owner, started.state.roundId, {
      commandId: id(1),
      expectedRevision: 0,
      initialBrand: "charitea_mate_can",
      reasonKeys: ["price", "other"],
    });
    expect(initial.state.phase).toBe("preparing_move");
    expect(initial.state.targetBrand).toBe("oom_balance");
    expect(initial.state.note).toBeNull();

    const ensured = await service.ensureMove(owner, started.state.roundId, {
      commandId: id(2),
      expectedRevision: 1,
    });
    expect(ensured.state.phase).toBe("awaiting_rechoice");
    expect(ensured.state.note?.targetBrand).toBe("oom_balance");
    expect(ensured.state.note?.origin).toBe("curated");

    const exposed = await service.exposure(owner, started.state.roundId, {
      commandId: id(3),
      noteHash: ensured.state.note!.noteHash,
      clientReportedDisplayedAt: "2026-10-03T12:00:01.000Z",
    });
    expect(exposed.state.exposure.acknowledgementSource).toBe("exposure_endpoint");
    expect(exposed.state.revision).toBe(2);

    const final = await service.final(owner, started.state.roundId, {
      commandId: id(4),
      expectedRevision: 2,
      finalBrand: "oom_balance",
      noteHash: ensured.state.note!.noteHash,
    });
    expect(final.state).toMatchObject({ phase: "finished", finalBrand: "oom_balance", switched: true, storyDelta: 10 });

    const retry = await service.final(owner, started.state.roundId, {
      commandId: id(4),
      expectedRevision: 0,
      finalBrand: "oom_balance",
      noteHash: ensured.state.note!.noteHash,
    });
    expect(retry.acknowledgement.replayed).toBe(true);
    expect(retry.state.storyDelta).toBe(10);
  });

  it("derives target and score server-side and rejects a guessed round from another session", async () => {
    const repository = new MemoryRoundRepository();
    const service = new RoundService(repository, config);
    const first = session("00000000-0000-4000-8000-000000000201");
    const second = session("00000000-0000-4000-8000-000000000202");
    const firstRound = await service.start(first);

    await expect(service.state(second, firstRound.state.roundId)).rejects.toMatchObject({ code: "not_found" });
    const initial = await service.initial(first, firstRound.state.roundId, {
      commandId: id(5),
      expectedRevision: 0,
      initialBrand: "oom_balance",
      reasonKeys: [],
    });
    const ensured = await service.ensureMove(first, firstRound.state.roundId, { commandId: id(6), expectedRevision: 1 });
    const stayed = await service.final(first, firstRound.state.roundId, {
      commandId: id(7),
      expectedRevision: ensured.state.revision,
      finalBrand: initial.state.initialBrand!,
      noteHash: ensured.state.note!.noteHash,
    });
    expect(stayed.state.storyDelta).toBe(-10);
    expect(stayed.state.finalBrand).toBe("oom_balance");
  });

  it("keeps a lost final response recoverable and starts a separate replay round", async () => {
    const repository = new MemoryRoundRepository();
    const service = new RoundService(repository, config);
    const owner = session("00000000-0000-4000-8000-000000000301");
    const started = await service.start(owner);
    await service.initial(owner, started.state.roundId, { commandId: id(8), expectedRevision: 0, initialBrand: "charitea_mate_can", reasonKeys: [] });
    const ensured = await service.ensureMove(owner, started.state.roundId, { commandId: id(9), expectedRevision: 1 });
    const final = await service.final(owner, started.state.roundId, { commandId: id(10), expectedRevision: 2, finalBrand: "charitea_mate_can", noteHash: ensured.state.note!.noteHash });
    expect((await service.state(owner, started.state.roundId)).storyDelta).toBe(final.state.storyDelta);

    const replay = await service.again(owner, started.state.roundId, { commandId: id(11), expectedRevision: 3 });
    expect(replay.state.roundId).not.toBe(started.state.roundId);
    expect(replay.state.roundIndex).toBe(2);
    expect(replay.state.phase).toBe("choosing");
    expect(replay.state.isReplay).toBe(true);
    const replayRetry = await service.again(owner, started.state.roundId, { commandId: id(11), expectedRevision: 0 });
    expect(replayRetry.state.roundId).toBe(replay.state.roundId);
  });

  it("keeps raw Other text out of the observer summary", async () => {
    const repository = new MemoryRoundRepository();
    const service = new RoundService(repository, config);
    const owner = session("00000000-0000-4000-8000-000000000401");
    const started = await service.start(owner);
    await service.initial(owner, started.state.roundId, {
      commandId: id(12),
      expectedRevision: 0,
      initialBrand: "charitea_mate_can",
      reasonKeys: ["other"],
      other: "private health detail that must stay protected",
    });
    const round = await repository.getRound(owner.id, started.state.roundId);
    expect(round).not.toBeNull();
    const summary = toObserverRound(round!);
    expect(summary.reasonKeys).toEqual([]);
    expect(JSON.stringify(summary)).not.toContain("private health detail");
  });
});
