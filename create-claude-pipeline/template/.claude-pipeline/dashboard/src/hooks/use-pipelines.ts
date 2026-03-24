"use client";

import { useState, useEffect, useCallback } from "react";
import type { PipelineSummary, ServerMessage } from "@/types/pipeline";
import { useWebSocket } from "./use-websocket";

export function usePipelines() {
  const [pipelines, setPipelines] = useState<PipelineSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await fetch("/api/pipelines");
      const data = await res.json();
      setPipelines(data.pipelines);
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMessage = useCallback((msg: ServerMessage) => {
    if (msg.type === "pipeline:updated") {
      setPipelines((prev) => {
        const idx = prev.findIndex((p) => p.id === msg.id);
        const summary: PipelineSummary = {
          id: msg.state.id,
          requirements: msg.state.requirements,
          status: msg.state.status,
          currentPhase: msg.state.currentPhase,
          createdAt: msg.state.createdAt,
          agents: msg.state.agents,
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = summary;
          return next;
        }
        return [summary, ...prev];
      });
    } else if (msg.type === "pipeline:removed") {
      setPipelines((prev) => prev.filter((p) => p.id !== msg.id));
    }
  }, []);

  const { send, connected } = useWebSocket(handleMessage, fetchPipelines);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  useEffect(() => {
    if (connected) {
      send({ type: "subscribe:all" });
    }
  }, [connected, send]);

  return { pipelines, loading };
}
