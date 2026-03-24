"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface NewPipelineModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewPipelineModal({ open, onClose }: NewPipelineModalProps) {
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirements.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements: requirements.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/pipeline/${data.id}`);
        onClose();
      } else {
        setError(data.error || "파이프라인 생성에 실패했습니다.");
      }
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-panel border border-border rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-text-primary text-lg font-semibold mb-4">New Pipeline</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="요구사항을 입력하세요..."
            className="w-full bg-[#111827] border border-border rounded-lg p-3 text-text-primary text-sm resize-none h-32 focus:outline-none focus:border-accent-purple"
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm mt-2 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-secondary bg-border rounded-lg hover:bg-text-muted/30">
              취소
            </button>
            <button type="submit" disabled={!requirements.trim() || loading} className="px-4 py-2 text-sm text-white bg-gradient-to-r from-accent-purple to-accent-purple-light rounded-lg disabled:opacity-50">
              {loading ? "생성 중..." : "생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
