"use client";

import { useState, useCallback } from "react";
import type { PipelineSummary, PipelineState } from "@/types/pipeline";
import { useSSE } from "./use-sse";

export function usePipelines() {
  const [pipelines, setPipelines] = useState<PipelineSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const handleEvent = useCallback((event: string, data: unknown) => {
    const d = data as Record<string, unknown>;

    if (event === "pipeline:init") {
      const list = d.pipelines as PipelineSummary[];
      setPipelines(list);
      setLoading(false);
    } else if (event === "pipeline:updated") {
      const state = d.state as PipelineState;
      const summary: PipelineSummary = {
        id: state.id,
        requirements: state.requirements,
        status: state.status,
        currentPhase: state.currentPhase,
        createdAt: state.createdAt,
        agents: state.agents,
      };
      setPipelines((prev) => {
        const idx = prev.findIndex((p) => p.id === state.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = summary;
          return next;
        }
        return [summary, ...prev];
      });
      setLoading(false);
    } else if (event === "pipeline:removed") {
      const id = d.id as string;
      setPipelines((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  useSSE("/api/pipelines/stream", handleEvent);

  return { pipelines, loading };
}
