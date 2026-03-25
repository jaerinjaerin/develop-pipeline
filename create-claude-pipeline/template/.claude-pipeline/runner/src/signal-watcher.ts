import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import type { StateManager } from "./state-manager.js";
import type { Activity } from "./types.js";

interface SignalWatcherEvents {
  checkpoint: [phase: number, description: string];
  phase: [phase: number];
  error: [err: Error];
}

export class SignalWatcher extends EventEmitter<SignalWatcherEvents> {
  private signalsDir: string;
  private timer: ReturnType<typeof setInterval> | null = null;
  private activityOffset = 0;
  private outputOffset = 0;

  constructor(
    private stateManager: StateManager,
    pipelinesDir: string,
    pipelineId: string,
  ) {
    super();
    this.signalsDir = path.join(pipelinesDir, pipelineId, "signals");
    fs.mkdirSync(this.signalsDir, { recursive: true });
  }

  start(intervalMs = 500): void {
    this.timer = setInterval(() => this.poll(), intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Atomically claim a signal file by renaming it, then read and delete.
   * Returns null if file doesn't exist or another process claimed it.
   */
  private claimAndRead(filePath: string): string | null {
    const claimedPath = filePath + ".processing";
    try {
      fs.renameSync(filePath, claimedPath);
    } catch {
      return null;
    }
    try {
      const content = fs.readFileSync(claimedPath, "utf-8");
      fs.unlinkSync(claimedPath);
      return content;
    } catch {
      try { fs.unlinkSync(claimedPath); } catch { /* ignore */ }
      return null;
    }
  }

  private poll(): void {
    try {
      this.processPhase();
      this.processAgents();
      this.processCheckpoint();
      this.processActivities();
      this.processOutputs();
    } catch (err) {
      this.emit("error", err instanceof Error ? err : new Error(String(err)));
    }
  }

  private processPhase(): void {
    const file = path.join(this.signalsDir, ".phase");
    const content = this.claimAndRead(file);
    if (content === null) return;

    const phase = parseInt(content.trim(), 10);
    if (!isNaN(phase) && phase >= 0 && phase <= 4) {
      this.stateManager.setPhase(phase);
      this.stateManager.addActivity("system", "info", `Phase ${phase} 시작`);
      this.emit("phase", phase);
    }
  }

  private processAgents(): void {
    let entries: string[];
    try {
      entries = fs.readdirSync(this.signalsDir);
    } catch {
      return;
    }

    for (const name of entries) {
      if (!name.startsWith(".agent_")) continue;
      // Skip .processing files from claimAndRead
      if (name.endsWith(".processing")) continue;
      const agentId = name.slice(".agent_".length);
      const file = path.join(this.signalsDir, name);

      const content = this.claimAndRead(file);
      if (content === null) continue;

      const status = content.trim();
      if (status === "working" || status === "done" || status === "idle") {
        this.stateManager.setAgentStatus(agentId, status);
      }
    }
  }

  private processCheckpoint(): void {
    const file = path.join(this.signalsDir, ".checkpoint");
    const content = this.claimAndRead(file);
    if (content === null) return;

    const pipeIdx = content.trim().indexOf("|");
    if (pipeIdx === -1) return;

    const phase = parseInt(content.trim().slice(0, pipeIdx), 10);
    const description = content.trim().slice(pipeIdx + 1);

    if (!isNaN(phase)) {
      this.stateManager.addActivity(
        "system", "info",
        `Checkpoint Phase ${phase}: ${description}`,
      );
      this.emit("checkpoint", phase, description);
    }
  }

  private processActivities(): void {
    const file = path.join(this.signalsDir, ".activity");
    let content: string;
    try {
      content = fs.readFileSync(file, "utf-8");
    } catch {
      return;
    }
    const lines = content.split("\n").filter(Boolean);

    for (let i = this.activityOffset; i < lines.length; i++) {
      const parts = lines[i].split("|");
      if (parts.length >= 3) {
        const agentId = parts[0].trim();
        const type = parts[1].trim() as Activity["type"];
        const message = parts.slice(2).join("|").trim();
        const validTypes = ["info", "success", "error", "progress"];
        if (validTypes.includes(type)) {
          this.stateManager.addActivity(agentId, type, message);
        }
      }
    }
    this.activityOffset = lines.length;

    if (lines.length > 100) {
      try {
        fs.truncateSync(file, 0);
      } catch { /* ignore */ }
      this.activityOffset = 0;
    }
  }

  private processOutputs(): void {
    const file = path.join(this.signalsDir, ".output");
    let content: string;
    try {
      content = fs.readFileSync(file, "utf-8");
    } catch {
      return;
    }
    const lines = content.split("\n").filter(Boolean);

    for (let i = this.outputOffset; i < lines.length; i++) {
      const pipeIdx = lines[i].indexOf("|");
      if (pipeIdx === -1) continue;

      const filename = lines[i].slice(0, pipeIdx).trim();
      const phase = parseInt(lines[i].slice(pipeIdx + 1).trim(), 10);
      if (filename && !isNaN(phase)) {
        this.stateManager.addOutput(filename, phase);
      }
    }
    this.outputOffset = lines.length;

    if (lines.length > 100) {
      try {
        fs.truncateSync(file, 0);
      } catch { /* ignore */ }
      this.outputOffset = 0;
    }
  }
}
