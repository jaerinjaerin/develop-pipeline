/**
 * SSE (Server-Sent Events) utility for Next.js API routes.
 * Replaces WebSocket for server→client push.
 */

export interface SSEWriter {
  write(event: string, data: unknown): void;
  close(): void;
}

export function createSSEResponse(
  handler: (writer: SSEWriter, signal: AbortSignal) => void | Promise<void>,
): Response {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController | null = null;
  const abortController = new AbortController();

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;

      const writer: SSEWriter = {
        write(event: string, data: unknown) {
          try {
            const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch {
            // Stream may be closed
          }
        },
        close() {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        },
      };

      handler(writer, abortController.signal);
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
