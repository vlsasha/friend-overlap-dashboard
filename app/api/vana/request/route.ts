import { createVanaController, returnUrlFromRequest } from "@/lib/vana";
import { errorResponse } from "../../responses";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const source = String(body.source ?? "instagram");
    const scopes = Array.isArray(body.scopes) 
      ? body.scopes.map(String) 
      : [String(body.scope ?? `${source}.following`)];

    const controller = createVanaController(source, scopes);
    const accessRequest = await controller.createAccessRequest({
      returnUrl: returnUrlFromRequest(request.url),
    });
    return Response.json({ ...accessRequest, source, scopes });
  } catch (error) {
    return errorResponse(error);
  }
}
