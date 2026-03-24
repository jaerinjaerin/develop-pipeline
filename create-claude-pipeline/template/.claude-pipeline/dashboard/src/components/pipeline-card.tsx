"use client";

import Link from "next/link";
import { PhaseDots } from "./phase-dots";
import { AGENT_MAP } from "@/lib/agents";
import type { PipelineSummary } from "@/types/pipeline";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PipelineCard({ pipeline }: { pipeline: PipelineSummary }) {
  const workingAgents = Object.values(pipeline.agents)
    .filter((a) => a.status === "working")
    .map((a) => AGENT_MAP[a.id]?.emoji)
    .filter(Boolean);

  const statusColor =
    pipeline.status === "running" ? "text-accent-green" :
    pipeline.status === "completed" ? "text-text-muted" :
    pipeline.status === "failed" ? "text-red-500" :
    "text-yellow-500";

  return (
    <Link href={`/pipeline/${pipeline.id}`}>
      <div className="bg-panel p-4 rounded-lg border border-border hover:border-accent-purple/50 transition-colors cursor-pointer flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] ${statusColor}`}>
              ● {pipeline.status.toUpperCase()}
            </span>
            <span className="text-text-primary text-[13px] font-medium">
              {pipeline.requirements}
            </span>
          </div>
          <div className="text-text-muted text-[11px]">
            Phase {pipeline.currentPhase}
            {workingAgents.length > 0 && ` · ${workingAgents.join("")} working`}
            {" · "}
            {timeAgo(pipeline.createdAt)}
          </div>
        </div>
        <PhaseDots currentPhase={pipeline.currentPhase} />
      </div>
    </Link>
  );
}
