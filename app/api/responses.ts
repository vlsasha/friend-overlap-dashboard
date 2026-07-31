export function errorResponse(error: unknown, opts?: { mapNotFound?: boolean }): Response {
  const message = error instanceof Error ? error.message : String(error);
  const status = opts?.mapNotFound && message.toLowerCase().includes('not found') ? 404 : 500;
  return Response.json({ error: message }, { status });
}

export function missingRequestIdResponse(): Response {
  return Response.json({ error: 'Missing requestId parameter' }, { status: 400 });
}
