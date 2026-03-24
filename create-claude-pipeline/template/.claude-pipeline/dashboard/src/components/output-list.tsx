"use client";

import type { OutputEntry } from "@/types/pipeline";
import { PHASE_NAMES } from "@/lib/agents";

interface OutputListProps {
  outputs: OutputEntry[];
  onSelect: (filename: string) => void;
  selected?: string;
}

export function OutputList({ outputs, onSelect, selected }: OutputListProps) {
  const grouped = outputs.reduce((acc, o) => {
    (acc[o.phase] ||= []).push(o);
    return acc;
  }, {} as Record<number, OutputEntry[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <div className="text-text-secondary text-[11px] font-semibold">OUTPUTS</div>
      </div>
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        {outputs.length === 0 ? (
          <div className="text-text-muted text-[11px] text-center py-10">아직 산출물이 없습니다.</div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([phase, files]) => (
              <div key={phase}>
                <div className="text-text-secondary text-[9px] font-semibold mt-2 mb-1">
                  PHASE {phase} {PHASE_NAMES[Number(phase)] || ""}
                </div>
                {files.map((f) => {
                  const icon = f.filename.endsWith(".html") ? "🌐" : "📄";
                  const name = f.filename.split("/").pop();
                  return (
                    <div
                      key={f.filename}
                      onClick={() => onSelect(f.filename)}
                      className={`px-2 py-1 rounded text-[11px] cursor-pointer ${
                        selected === f.filename
                          ? "bg-border text-accent-purple-light"
                          : "text-text-primary hover:bg-panel"
                      }`}
                    >
                      {icon} {name}
                    </div>
                  );
                })}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
