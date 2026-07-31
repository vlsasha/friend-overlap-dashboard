import { createVanaController } from "@/lib/vana";
import { errorResponse, missingRequestIdResponse } from "../../responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CACHED_READS = 100;
const readCache = new Map<string, Promise<unknown>>();

function cacheRead(key: string, read: Promise<unknown>): void {
  if (readCache.size >= MAX_CACHED_READS) {
    const oldest = readCache.keys().next().value;
    if (oldest !== undefined) readCache.delete(oldest);
  }
  readCache.set(key, read);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId");
  const source = url.searchParams.get("source") ?? "instagram";
  const scope = url.searchParams.get("scope") ?? `${source}.following`;

  if (!requestId) return missingRequestIdResponse();

  const cacheKey = `${requestId}:${source}:${scope}`;
  let read = readCache.get(cacheKey);
  if (!read) {
    const controller = createVanaController(source, [scope]);
    read = controller.readApprovedData({ requestId });
    cacheRead(cacheKey, read);
    read.catch(() => {
      if (readCache.get(cacheKey) === read) readCache.delete(cacheKey);
    });
  }

  try {
    return Response.json(await read);
  } catch (error) {
    return errorResponse(error, { mapNotFound: true });
  }
}
