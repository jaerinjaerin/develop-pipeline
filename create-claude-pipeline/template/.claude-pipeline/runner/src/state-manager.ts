import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { PipelineState, Activity, AgentState, OutputEntry } from "./types.js";

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

  /** Atomic update: read → modify → write via temp file + rename */
  update(updater: (state: PipelineState) => PipelineState): void {
    const state = this.read();
    if (!state) throw new Error(`Cannot read state: ${this.stateFile}`);

    const updated = updater(state);
    const tmpFile = path.join(this.pipelineDir, `.state.tmp.${Date.now()}`);

    fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2));
    fs.renameSync(tmpFile, this.stateFile);
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
    this.update((s) => ({
      ...s,
      activities: [
        ...s.activities,
        {
          id: crypto.randomUUID(),
          agentId,
          message,
          timestamp: new Date().toISOString(),
          type,
        },
      ],
    }));
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
