import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { PipelineState, Activity, AgentState, OutputEntry } from "./types.js";

const MAX_ACTIVITIES = 200;

export class StateManager {
  private stateFile: string;
  private pipelineDir: string;

  constructor(pipelinesDir: string, pipelineId: string) {
    this.pipelineDir = path.join(pipelinesDir, pipelineId);
    this.stateFile = path.join(this.pipelineDir, "state.json");
  }

  read(): PipelineState | null {
    try {
      const raw = fs.readFileSync(this.stateFile, "utf-8");
      return JSON.parse(raw) as PipelineState;
    } catch {
      return null;
    }
  }

  /**
   * Atomic update: read → modify → write via temp file + rename.
   *
   * INVARIANT: Only ONE process should write to state.json.
   * Currently Runner and ContextWatcher share a single Node.js process,
   * and all I/O is synchronous, so the event loop serializes updates.
   * If the architecture changes to multi-process, add file locking.
   */
  update(updater: (state: PipelineState) => PipelineState): void {
    const state = this.read();
    if (!state) throw new Error(`Cannot read state: ${this.stateFile}`);

    const updated = updater(state);
    const tmpFile = path.join(this.pipelineDir, `.state.tmp.${Date.now()}`);

    fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2));
    try {
      fs.renameSync(tmpFile, this.stateFile);
    } catch (err) {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      throw err;
    }
  }

  setStatus(status: PipelineState["status"]): void {
    this.update((s) => ({ ...s, status }));
  }

  setPhase(phase: number): void {
    this.update((s) => ({ ...s, currentPhase: phase }));
  }

  setAgentStatus(agentId: string, status: AgentState["status"], currentTask?: string): void {
    this.update((s) => ({
      ...s,
      agents: {
        ...s.agents,
        [agentId]: { id: agentId, status, currentTask },
      },
    }));
  }

  addActivity(agentId: string, type: Activity["type"], message: string): void {
    this.update((s) => {
      const newActivity = {
        id: crypto.randomUUID(),
        agentId,
        message,
        timestamp: new Date().toISOString(),
        type,
      };
      const activities = [...s.activities, newActivity];
      const trimmed = activities.length > MAX_ACTIVITIES
        ? activities.slice(activities.length - MAX_ACTIVITIES)
        : activities;
      return { ...s, activities: trimmed };
    });
  }

  addOutput(filename: string, phase: number): void {
    this.update((s) => {
      const exists = s.outputs.some((o) => o.filename === filename);
      if (exists) return s;
      return {
        ...s,
        outputs: [
          ...s.outputs,
          {
            filename,
            status: "complete" as const,
            phase,
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }
}
