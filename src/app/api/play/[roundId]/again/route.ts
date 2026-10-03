import { againRequestSchema } from "@/features/one-move/contracts";
import { requireSession } from "@/features/one-move/server/auth";
import { assertSameOrigin, errorResponse, jsonResponse, readJson } from "@/features/one-move/server/http";
import { configuredRepository } from "@/features/one-move/server/repository-factory";
import { RoundService } from "@/features/one-move/server/round-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ roundId: string }> }): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body = againRequestSchema.parse(await readJson(request));
    const repository = configuredRepository();
    const session = await requireSession(repository);
    const { roundId } = await params;
    const result = await new RoundService(repository).again(session, roundId, body);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
