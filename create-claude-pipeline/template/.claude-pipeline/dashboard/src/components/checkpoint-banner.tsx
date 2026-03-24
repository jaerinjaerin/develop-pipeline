"use client";

import { useState } from "react";
import type { CheckpointInfo } from "@/types/pipeline";

interface CheckpointBannerProps {
  checkpoint: CheckpointInfo;
  onRespond: (action: "approve" | "reject", message?: string) => void;
}

export function CheckpointBanner({ checkpoint, onRespond }: CheckpointBannerProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (showFeedback) {
    return (
      <div className="mx-4 mb-3 bg-gradient-to-r from-accent-purple/10 to-accent-purple-light/10 border border-accent-purple rounded-lg p-4">
        <div className="text-accent-purple-light text-[12px] font-semibold mb-2">피드백 작성</div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full bg-[#111827] border border-border rounded-lg p-2 text-text-primary text-sm resize-none h-20 focus:outline-none focus:border-accent-purple"
          placeholder="추가 지시사항을 입력하세요..."
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <button onClick={() => setShowFeedback(false)} className="px-3 py-1 text-[11px] text-text-secondary bg-border rounded-md">
            취소
          </button>
          <button
            onClick={() => onRespond("reject", feedback)}
            disabled={!feedback.trim()}
            className="px-3 py-1 text-[11px] text-white bg-red-500/80 rounded-md disabled:opacity-50"
          >
            거절 + 재작업
          </button>
          <button
            onClick={() => onRespond("approve", feedback)}
            className="px-3 py-1 text-[11px] text-white bg-gradient-to-r from-accent-purple to-accent-purple-light rounded-md"
          >
            피드백과 함께 승인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 bg-gradient-to-r from-accent-purple/10 to-accent-purple-light/10 border border-accent-purple rounded-lg px-4 py-3 flex justify-between items-center">
      <div>
        <div className="text-accent-purple-light text-[12px] font-semibold">
          ⏳ CHECKPOINT {checkpoint.phase}
        </div>
        <div className="text-text-primary text-[12px] mt-1">{checkpoint.description}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setShowFeedback(true)} className="px-3 py-1 text-[11px] text-text-primary bg-border rounded-md hover:bg-text-muted/30">
          피드백
        </button>
        <button onClick={() => onRespond("approve")} className="px-3 py-1 text-[11px] text-white bg-gradient-to-r from-accent-purple to-accent-purple-light rounded-md">
          승인
        </button>
      </div>
    </div>
  );
}
