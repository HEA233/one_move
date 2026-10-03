import { startRequestSchema } from "@/features/one-move/contracts";
import { getOrCreateSession } from "@/features/one-move/server/auth";
import { assertSameOrigin, errorResponse, jsonResponse, readJson } from "@/features/one-move/server/http";
import { configuredRepository } from "@/features/one-move/server/repository-factory";
import { RoundService } from "@/features/one-move/server/round-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body = startRequestSchema.parse(await readJson(request));
    const repository = configuredRepository();
    const auth = await getOrCreateSession(repository);
    const service = new RoundService(repository);
    const result = await service.start(auth.session, body);
    const response = jsonResponse({
      acknowledgement: { action: "start", replayed: !result.created },
      state: result.state,
    });
    return auth.setCookie(response);
  } catch (error) {
    return errorResponse(error);
  }
}
