import { requireSession } from "@/features/one-move/server/auth";
import { errorResponse, jsonResponse } from "@/features/one-move/server/http";
import { configuredRepository } from "@/features/one-move/server/repository-factory";
import { RoundService } from "@/features/one-move/server/round-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ roundId: string }> }): Promise<Response> {
  try {
    const repository = configuredRepository();
    const session = await requireSession(repository);
    const { roundId } = await params;
    const state = await new RoundService(repository).state(session, roundId);
    return jsonResponse({ state });
  } catch (error) {
    return errorResponse(error);
  }
}
