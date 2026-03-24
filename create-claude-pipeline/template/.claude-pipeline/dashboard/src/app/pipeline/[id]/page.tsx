"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePipelineDetail } from "@/hooks/use-pipeline-detail";
import { PhaseDots } from "@/components/phase-dots";
import { AgentCardList } from "@/components/agent-card";
import { AgentLogs } from "@/components/agent-logs";
import { OutputList } from "@/components/output-list";
import { CheckpointBanner } from "@/components/checkpoint-banner";
import { ResizablePanels } from "@/components/resizable-panels";
import { ArtifactViewer } from "@/components/artifact-viewer";

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { pipeline, checkpoint, loading, notFound, respondToCheckpoint } = usePipelineDetail(id);
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);

  if (loading) {
    return <div className="text-text-secondary text-center py-20">Loading...</div>;
  }

  if (notFound || !pipeline) {
    router.push("/");
    return null;
  }

  const statusColor =
    pipeline.status === "running" ? "text-accent-green" :
    pipeline.status === "completed" ? "text-text-muted" :
    pipeline.status === "failed" ? "text-red-500" :
    "text-yellow-500";

  return (
    <div className="h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="px-6 py-3 border-b border-border flex-shrink-0">
        <div className="flex justify-between items-start">
          <button onClick={() => router.push("/")} className="text-text-secondary text-[11px] hover:text-text-primary">
            ← Back
          </button>
          <span className={`text-[11px] ${statusColor}`}>● {pipeline.status.toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <h1 className="text-base font-semibold text-text-primary">{pipeline.requirements}</h1>
          <PhaseDots currentPhase={pipeline.currentPhase} showLabel />
        </div>
      </header>

      {/* 3-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanels
          left={<AgentCardList agents={pipeline.agents} />}
          center={<AgentLogs activities={pipeline.activities} />}
          right={
            <OutputList
              outputs={pipeline.outputs}
              onSelect={setSelectedOutput}
              selected={selectedOutput || undefined}
            />
          }
        />
      </div>

      {/* Checkpoint Banner */}
      {checkpoint && checkpoint.status === "pending" && (
        <CheckpointBanner checkpoint={checkpoint} onRespond={respondToCheckpoint} />
      )}

      {/* Artifact Viewer */}
      {selectedOutput && (
        <ArtifactViewer
          pipelineId={id}
          outputs={pipeline.outputs}
          selected={selectedOutput}
          onSelect={setSelectedOutput}
          onClose={() => setSelectedOutput(null)}
        />
      )}
    </div>
  );
}
