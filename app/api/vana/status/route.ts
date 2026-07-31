import { createVanaController } from "@/lib/vana";
import { errorResponse, missingRequestIdResponse } from "../../responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId");
  const source = url.searchParams.get("source") ?? "instagram";
  const scope = url.searchParams.get("scope") ?? `${source}.following`;

  if (!requestId) return missingRequestIdResponse();

  try {
    const controller = createVanaController(source, [scope]);
    const status = await controller.getAccessRequestStatus(requestId);
    return Response.json(status);
  } catch (error) {
    return errorResponse(error, { mapNotFound: true });
  }
}
