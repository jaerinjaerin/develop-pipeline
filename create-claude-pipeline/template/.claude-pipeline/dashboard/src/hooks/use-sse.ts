"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export type SSEHandler = (event: string, data: unknown) => void;

/**
 * React hook for Server-Sent Events.
 * Browser-native EventSource with automatic reconnection.
 */
export function useSSE(url: string | null, onEvent: SSEHandler) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!url) return;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects natively
    };

    // Named event listener helper
    const events = [
      "pipeline:updated",
      "pipeline:activity",
      "pipeline:checkpoint",
      "pipeline:removed",
      "pipeline:init",
      "error",
    ];

    for (const eventName of events) {
      es.addEventListener(eventName, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          onEventRef.current(eventName, data);
        } catch {
          // Ignore parse errors
        }
      });
    }

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [url]);

  return { connected };
}
