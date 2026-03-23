import fs from "fs";
import path from "path";
import { getPipelinesDir, readPipelineState } from "./pipelines";
import type { PipelineState } from "@/types/pipeline";

type WatchCallback = (id: string, state: PipelineState | null) => void;

export class PipelineWatcher {
  private watchers = new Map<string, fs.FSWatcher>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private dirWatcher: fs.FSWatcher | null = null;
  private callback: WatchCallback;

  constructor(callback: WatchCallback) {
    this.callback = callback;
  }

  start() {
    const dir = getPipelinesDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.dirWatcher = fs.watch(dir, (_, filename) => {
      if (!filename) return;
      const fullPath = path.join(dir, filename);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        this.watchPipeline(filename);
      } else {
        this.unwatchPipeline(filename);
      }
    });

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        this.watchPipeline(entry.name);
      }
    }
  }

  private watchPipeline(id: string) {
    if (this.watchers.has(id)) return;

    const stateFile = path.join(getPipelinesDir(), id, "state.json");
    if (!fs.existsSync(stateFile)) return;

    try {
      const watcher = fs.watch(stateFile, () => {
        const existing = this.debounceTimers.get(id);
        if (existing) clearTimeout(existing);

        this.debounceTimers.set(id, setTimeout(() => {
          this.debounceTimers.delete(id);
          const state = readPipelineState(id);
          this.callback(id, state);
        }, 100));
      });

      watcher.on("error", () => {
        this.unwatchPipeline(id);
        this.callback(id, null);
      });

      this.watchers.set(id, watcher);
    } catch {
      // Ignore watch errors
    }
  }

  private unwatchPipeline(id: string) {
    const watcher = this.watchers.get(id);
    if (watcher) {
      watcher.close();
      this.watchers.delete(id);
    }
    const timer = this.debounceTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(id);
    }
  }

  stop() {
    this.dirWatcher?.close();
    for (const [id] of this.watchers) {
      this.unwatchPipeline(id);
    }
  }
}
