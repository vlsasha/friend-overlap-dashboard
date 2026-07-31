import { getVanaController } from "@/lib/vana";
import { errorResponse, missingRequestIdResponse } from "../../responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache reads per requestId to avoid double-paying escrow fees in live mode
const MAX_CACHED_READS = 100;
const readCache = new Map<string, Promise<unknown>>();

function cacheRead(requestId: string, read: Promise<unknown>): void {
  if (readCache.size >= MAX_CACHED_READS) {
    const oldest = readCache.keys().next().value;
    if (oldest !== undefined) readCache.delete(oldest);
  }
  readCache.set(requestId, read);
}

export async function GET(request: Request): Promise<Response> {
  const requestId = new URL(request.url).searchParams.get("requestId");
  if (!requestId) return missingRequestIdResponse();

  let read = readCache.get(requestId);
  if (!read) {
    read = getVanaController().readApprovedData({ requestId });
    cacheRead(requestId, read);
    read.catch(() => {
      if (readCache.get(requestId) === read) readCache.delete(requestId);
    });
  }

  try {
    return Response.json(await read);
  } catch (error) {
    return errorResponse(error, { mapNotFound: true });
  }
}
