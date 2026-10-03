import { requireObserver } from "@/features/one-move/server/observer-auth";
import { errorResponse, jsonResponse } from "@/features/one-move/server/http";
import { configuredRepository } from "@/features/one-move/server/repository-factory";
import { toObserverRound } from "@/features/one-move/observer/dto";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    requireObserver(request);
    const rounds = await configuredRepository().listRounds(50);
    return jsonResponse({
      readOnly: true,
      caveat: "Contextual allocation; exploratory results, not causal uplift.",
      rounds: rounds.filter((round) => round.evidenceMode !== "fixture").map(toObserverRound),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
