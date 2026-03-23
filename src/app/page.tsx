"use client";

import { useState } from "react";
import { usePipelines } from "@/hooks/use-pipelines";
import { PipelineCard } from "@/components/pipeline-card";
import { NewPipelineModal } from "@/components/new-pipeline-modal";

export default function Home() {
  const { pipelines, loading } = usePipelines();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-between items-center px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold bg-gradient-to-r from-accent-purple to-accent-purple-light bg-clip-text text-transparent">
          Pipeline Dashboard
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-accent-purple to-accent-purple-light text-white text-sm px-4 py-2 rounded-lg hover:opacity-90"
        >
          + New Pipeline
        </button>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-text-secondary text-center py-20">Loading...</div>
        ) : pipelines.length === 0 ? (
          <div className="text-text-secondary text-center py-20">
            아직 파이프라인이 없습니다.
            <br />
            <button onClick={() => setModalOpen(true)} className="text-accent-purple-light mt-2 hover:underline">
              + New Pipeline으로 시작하세요.
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-4xl mx-auto">
            {pipelines.map((p) => (
              <PipelineCard key={p.id} pipeline={p} />
            ))}
          </div>
        )}
      </main>

      <NewPipelineModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
