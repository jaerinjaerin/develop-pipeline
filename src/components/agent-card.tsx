"use client";

import { AGENTS } from "@/lib/agents";
import type { AgentState } from "@/types/pipeline";

interface AgentCardListProps {
  agents: Record<string, AgentState>;
}

export function AgentCardList({ agents }: AgentCardListProps) {
  return (
    <div className="p-3">
      <div className="text-text-secondary text-[11px] font-semibold mb-2">AGENTS</div>
      <div className="flex flex-col gap-[6px]">
        {AGENTS.map((meta) => {
          const state = agents[meta.id];
          const status = state?.status || "idle";
          const borderColor =
            status === "working" ? meta.workingColor : "#6b7280";
          const statusColor =
            status === "working" ? meta.workingColor :
            status === "done" ? "#6b7280" : "#6b7280";

          return (
            <div
              key={meta.id}
              className="bg-panel p-2 rounded-md flex justify-between items-center text-[11px]"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              <span className="text-text-primary">
                {meta.emoji} {meta.name} ({meta.role})
              </span>
              <span style={{ color: statusColor }}>{status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
