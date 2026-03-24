"use client";

import { useState, useCallback } from "react";
import type { PipelineState, CheckpointInfo } from "@/types/pipeline";
import { useSSE } from "./use-sse";

export function usePipelineDetail(id: string) {
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [checkpoint, setCheckpoint] = useState<CheckpointInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const handleEvent = useCallback((event: string, data: unknown) => {
    const d = data as Record<string, unknown>;

    if (event === "pipeline:updated" && d.id === id) {
      setPipeline(d.state as PipelineState);
      setLoading(false);
    } else if (event === "pipeline:activity" && d.id === id) {
      setPipeline((prev) => {
        if (!prev) return prev;
        const activity = d.activity as PipelineState["activities"][0];
        return { ...prev, activities: [...prev.activities, activity] };
      });
    } else if (event === "pipeline:checkpoint" && d.id === id) {
      setCheckpoint(d.checkpoint as CheckpointInfo);
    } else if (event === "pipeline:removed" && d.id === id) {
      setNotFound(true);
    }
  }, [id]);

  useSSE(`/api/pipelines/${id}/events`, handleEvent);

  const respondToCheckpoint = useCallback(
    async (action: "approve" | "reject", message?: string) => {
      try {
        await fetch(`/api/pipelines/${id}/checkpoint`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, message }),
        });
        setCheckpoint(null);
      } catch {
        // Ignore fetch errors
      }
    },
    [id],
  );

  return { pipeline, checkpoint, loading, notFound, respondToCheckpoint };
}
