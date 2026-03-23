"use client";

import { useState, useEffect, useCallback } from "react";
import type { PipelineState, CheckpointInfo, ServerMessage } from "@/types/pipeline";
import { useWebSocket } from "./use-websocket";

export function usePipelineDetail(id: string) {
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [checkpoint, setCheckpoint] = useState<CheckpointInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipelines/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setPipeline(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    if (msg.type === "pipeline:updated" && msg.id === id) {
      setPipeline(msg.state);
    } else if (msg.type === "pipeline:activity" && msg.id === id) {
      setPipeline((prev) => {
        if (!prev) return prev;
        return { ...prev, activities: [...prev.activities, msg.activity] };
      });
    } else if (msg.type === "pipeline:checkpoint" && msg.id === id) {
      setCheckpoint(msg.checkpoint);
    } else if (msg.type === "pipeline:removed" && msg.id === id) {
      setNotFound(true);
    }
  }, [id]);

  const { send, connected } = useWebSocket(handleMessage, fetchPipeline);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  useEffect(() => {
    if (connected) {
      send({ type: "subscribe", pipelineId: id });
      return () => {
        send({ type: "unsubscribe", pipelineId: id });
      };
    }
  }, [connected, id, send]);

  const respondToCheckpoint = useCallback((action: "approve" | "reject", message?: string) => {
    send({ type: "checkpoint:respond", pipelineId: id, action, message });
    setCheckpoint(null);
  }, [id, send]);

  return { pipeline, checkpoint, loading, notFound, respondToCheckpoint };
}
