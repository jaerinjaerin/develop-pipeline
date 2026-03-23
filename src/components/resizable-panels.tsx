"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";

interface ResizablePanelsProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

const STORAGE_KEY = "panel-sizes";
const DEFAULT_SIZES = [25, 50, 25];
const MIN_SIZES = [160, 200, 180];

export function ResizablePanels({ left, center, right }: ResizablePanelsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState(DEFAULT_SIZES);
  const dragState = useRef<{ index: number; startX: number; startSizes: number[] } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSizes(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
  }, [sizes]);

  const onMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    dragState.current = { index, startX: e.clientX, startSizes: [...sizes] };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current || !containerRef.current) return;
      const { index, startX, startSizes } = dragState.current;
      const containerWidth = containerRef.current.offsetWidth;
      const deltaPct = ((e.clientX - startX) / containerWidth) * 100;

      const newSizes = [...startSizes];
      newSizes[index] = Math.max((MIN_SIZES[index] / containerWidth) * 100, startSizes[index] + deltaPct);
      newSizes[index + 1] = Math.max((MIN_SIZES[index + 1] / containerWidth) * 100, startSizes[index + 1] - deltaPct);

      setSizes(newSizes);
    };

    const onMouseUp = () => {
      dragState.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sizes]);

  const onDoubleClick = useCallback(() => {
    setSizes(DEFAULT_SIZES);
  }, []);

  return (
    <div ref={containerRef} className="flex h-full">
      <div style={{ width: `${sizes[0]}%` }} className="overflow-y-auto">
        {left}
      </div>
      <div
        className="w-[6px] bg-panel cursor-col-resize flex items-center justify-center flex-shrink-0 hover:bg-border transition-colors"
        onMouseDown={(e) => onMouseDown(0, e)}
        onDoubleClick={onDoubleClick}
      >
        <span className="text-text-muted text-[9px] writing-mode-vertical select-none">⋮⋮</span>
      </div>
      <div style={{ width: `${sizes[1]}%` }} className="overflow-hidden flex flex-col">
        {center}
      </div>
      <div
        className="w-[6px] bg-panel cursor-col-resize flex items-center justify-center flex-shrink-0 hover:bg-border transition-colors"
        onMouseDown={(e) => onMouseDown(1, e)}
        onDoubleClick={onDoubleClick}
      >
        <span className="text-text-muted text-[9px] writing-mode-vertical select-none">⋮⋮</span>
      </div>
      <div style={{ width: `${sizes[2]}%` }} className="overflow-y-auto">
        {right}
      </div>
    </div>
  );
}
