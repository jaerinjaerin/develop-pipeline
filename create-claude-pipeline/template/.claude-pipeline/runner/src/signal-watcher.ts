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
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, "utf-8").trim();
    const phase = parseInt(content, 10);
    if (!isNaN(phase) && phase >= 0 && phase <= 4) {
      this.stateManager.setPhase(phase);
      this.stateManager.addActivity("system", "info", `Phase ${phase} 시작`);
      this.emit("phase", phase);
    }
    fs.unlinkSync(file);
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
      const agentId = name.slice(".agent_".length);
      const file = path.join(this.signalsDir, name);

      try {
        const status = fs.readFileSync(file, "utf-8").trim();
        if (status === "working" || status === "done" || status === "idle") {
          this.stateManager.setAgentStatus(agentId, status);
        }
        fs.unlinkSync(file);
      } catch {
        // file may have been deleted between readdir and read
      }
    }
  }

  private processCheckpoint(): void {
    const file = path.join(this.signalsDir, ".checkpoint");
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, "utf-8").trim();
    const pipeIdx = content.indexOf("|");
    if (pipeIdx === -1) {
      fs.unlinkSync(file);
      return;
    }

    const phase = parseInt(content.slice(0, pipeIdx), 10);
    const description = content.slice(pipeIdx + 1);

    if (!isNaN(phase)) {
      this.stateManager.addActivity(
        "system",
        "info",
        `Checkpoint Phase ${phase}: ${description}`,
      );
      this.emit("checkpoint", phase, description);
    }
    fs.unlinkSync(file);
  }

  private processActivities(): void {
    const file = path.join(this.signalsDir, ".activity");
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, "utf-8");
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

    // Truncate if file gets too large (> 100 lines)
    if (lines.length > 100) {
      fs.unlinkSync(file);
      this.activityOffset = 0;
    }
  }

  private processOutputs(): void {
    const file = path.join(this.signalsDir, ".output");
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, "utf-8");
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
      fs.unlinkSync(file);
      this.outputOffset = 0;
    }
  }
}
