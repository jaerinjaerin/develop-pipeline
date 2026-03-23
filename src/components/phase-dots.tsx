"use client";

import { PHASE_NAMES } from "@/lib/agents";

interface PhaseDotsProp {
  currentPhase: number;
  showLabel?: boolean;
}

export function PhaseDots({ currentPhase, showLabel = false }: PhaseDotsProp) {
  return (
    <div className="flex items-center gap-[6px]">
      {PHASE_NAMES.map((name, i) => {
        const isComplete = i < currentPhase;
        const isCurrent = i === currentPhase;
        return (
          <div
            key={i}
            className={`rounded-full ${
              isCurrent
                ? "w-[10px] h-[10px] bg-accent-purple-light shadow-[0_0_6px_rgba(139,92,246,0.5)]"
                : isComplete
                ? "w-2 h-2 bg-accent-purple"
                : "w-2 h-2 bg-border"
            }`}
            title={`P${i} ${name}`}
          />
        );
      })}
      {showLabel && (
        <span className="text-text-secondary text-[11px] ml-1">
          P{currentPhase} {PHASE_NAMES[currentPhase]}
        </span>
      )}
    </div>
  );
}
