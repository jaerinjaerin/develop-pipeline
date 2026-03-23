"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { OutputEntry } from "@/types/pipeline";
import { PHASE_NAMES } from "@/lib/agents";

interface ArtifactViewerProps {
  pipelineId: string;
  outputs: OutputEntry[];
  selected: string;
  onSelect: (filename: string | null) => void;
  onClose: () => void;
}

export function ArtifactViewer({ pipelineId, outputs, selected, onSelect, onClose }: ArtifactViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`/api/pipelines/${pipelineId}/outputs/${selected}`)
      .then((res) => res.text())
      .then(setContent)
      .catch(() => setContent("Failed to load file"))
      .finally(() => setLoading(false));
  }, [pipelineId, selected]);

  const ext = selected.split(".").pop()?.toLowerCase() || "";
  const isMarkdown = ext === "md";
  const isHtml = ext === "html";

  const grouped = outputs.reduce((acc, o) => {
    (acc[o.phase] ||= []).push(o);
    return acc;
  }, {} as Record<number, OutputEntry[]>);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-4xl bg-[#111827] border-l border-border flex" onClick={(e) => e.stopPropagation()}>
        {/* File list */}
        <div className="w-[200px] bg-panel border-r border-border overflow-y-auto flex-shrink-0">
          <div className="px-3 py-2 border-b border-border">
            <div className="text-text-secondary text-[10px] font-semibold">FILES</div>
          </div>
          <div className="p-2 text-[11px]">
            {Object.entries(grouped)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([phase, files]) => (
                <div key={phase}>
                  <div className="text-text-secondary text-[9px] font-semibold mt-2 mb-1">
                    PHASE {phase}
                  </div>
                  {files.map((f) => {
                    const icon = f.filename.endsWith(".html") ? "🌐" : "📄";
                    const name = f.filename.split("/").pop();
                    return (
                      <div
                        key={f.filename}
                        onClick={() => onSelect(f.filename)}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          selected === f.filename
                            ? "bg-border text-accent-purple-light"
                            : "text-text-secondary hover:bg-panel"
                        }`}
                      >
                        {icon} {name}
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-border">
            <div className="text-text-primary text-sm font-semibold">{selected.split("/").pop()}</div>
            <div className="flex items-center gap-2">
              {isMarkdown && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode("rendered")}
                    className={`px-2 py-1 text-[10px] rounded ${viewMode === "rendered" ? "bg-panel text-accent-purple-light" : "text-text-muted"}`}
                  >
                    Rendered
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={`px-2 py-1 text-[10px] rounded ${viewMode === "raw" ? "bg-panel text-accent-purple-light" : "text-text-muted"}`}
                  >
                    Raw
                  </button>
                </div>
              )}
              <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg">×</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-text-muted text-center py-10">Loading...</div>
            ) : isHtml ? (
              <iframe
                srcDoc={content}
                className="w-full h-full border-0 bg-white rounded"
                sandbox="allow-scripts"
              />
            ) : isMarkdown && viewMode === "rendered" ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const inline = !match;
                      return inline ? (
                        <code className="bg-panel px-1 py-0.5 rounded text-accent-purple-light" {...props}>
                          {children}
                        </code>
                      ) : (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      );
                    },
                  }}
                />
              </div>
            ) : (
              <SyntaxHighlighter
                style={oneDark}
                language={isMarkdown ? "markdown" : ext}
                showLineNumbers
              >
                {content}
              </SyntaxHighlighter>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
