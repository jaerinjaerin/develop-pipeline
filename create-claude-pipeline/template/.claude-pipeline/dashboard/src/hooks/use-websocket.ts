"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ServerMessage, ClientMessage } from "@/types/pipeline";

export function useWebSocket(onMessage: (msg: ServerMessage) => void, onReconnect?: () => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(1000);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      const wasDisconnected = !connected;
      setConnected(true);
      reconnectDelay.current = 1000;
      // Signal reconnect so data hooks can re-fetch
      if (wasDisconnected && onReconnect) onReconnect();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        onMessage(msg);
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      // Suppress console noise — onclose handles reconnection
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // Exponential backoff reconnection (1s → 2s → 4s → ... → 30s max)
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(delay * 2, 30000);
      setTimeout(connect, delay);
    };

    wsRef.current = ws;
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send, connected };
}
