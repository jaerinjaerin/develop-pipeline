import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
export class SignalWatcher extends EventEmitter {
    stateManager;
    signalsDir;
    timer = null;
    activityOffset = 0;
    outputOffset = 0;
    constructor(stateManager, pipelinesDir, pipelineId) {
        super();
        this.stateManager = stateManager;
        this.signalsDir = path.join(pipelinesDir, pipelineId, "signals");
        fs.mkdirSync(this.signalsDir, { recursive: true });
    }
    start(intervalMs = 500) {
        this.timer = setInterval(() => this.poll(), intervalMs);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    /**
     * Atomically claim a signal file by renaming it, then read and delete.
     * Returns null if file doesn't exist or another process claimed it.
     */
    claimAndRead(filePath) {
        const claimedPath = filePath + ".processing";
        try {
            fs.renameSync(filePath, claimedPath);
        }
        catch {
            return null;
        }
        try {
            const content = fs.readFileSync(claimedPath, "utf-8");
            fs.unlinkSync(claimedPath);
            return content;
        }
        catch {
            try {
                fs.unlinkSync(claimedPath);
            }
            catch { /* ignore */ }
            return null;
        }
    }
    poll() {
        try {
            this.processPhase();
            this.processAgents();
            this.processCheckpoint();
            this.processActivities();
            this.processOutputs();
        }
        catch (err) {
            this.emit("error", err instanceof Error ? err : new Error(String(err)));
        }
    }
    processPhase() {
        const file = path.join(this.signalsDir, ".phase");
        const content = this.claimAndRead(file);
        if (content === null)
            return;
        const phase = parseInt(content.trim(), 10);
        if (!isNaN(phase) && phase >= 0 && phase <= 4) {
            this.stateManager.setPhase(phase);
            this.stateManager.addActivity("system", "info", `Phase ${phase} 시작`);
            this.emit("phase", phase);
        }
    }
    processAgents() {
        let entries;
        try {
            entries = fs.readdirSync(this.signalsDir);
        }
        catch {
            return;
        }
        for (const name of entries) {
            if (!name.startsWith(".agent_"))
                continue;
            // Skip .processing files from claimAndRead
            if (name.endsWith(".processing"))
                continue;
            const agentId = name.slice(".agent_".length);
            const file = path.join(this.signalsDir, name);
            const content = this.claimAndRead(file);
            if (content === null)
                continue;
            const status = content.trim();
            if (status === "working" || status === "done" || status === "idle") {
                this.stateManager.setAgentStatus(agentId, status);
            }
        }
    }
    processCheckpoint() {
        const file = path.join(this.signalsDir, ".checkpoint");
        const content = this.claimAndRead(file);
        if (content === null)
            return;
        const pipeIdx = content.trim().indexOf("|");
        if (pipeIdx === -1)
            return;
        const phase = parseInt(content.trim().slice(0, pipeIdx), 10);
        const description = content.trim().slice(pipeIdx + 1);
        if (!isNaN(phase)) {
            this.stateManager.addActivity("system", "info", `Checkpoint Phase ${phase}: ${description}`);
            this.emit("checkpoint", phase, description);
        }
    }
    processActivities() {
        const file = path.join(this.signalsDir, ".activity");
        if (!fs.existsSync(file))
            return;
        const content = fs.readFileSync(file, "utf-8");
        const lines = content.split("\n").filter(Boolean);
        for (let i = this.activityOffset; i < lines.length; i++) {
            const parts = lines[i].split("|");
            if (parts.length >= 3) {
                const agentId = parts[0].trim();
                const type = parts[1].trim();
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
    processOutputs() {
        const file = path.join(this.signalsDir, ".output");
        if (!fs.existsSync(file))
            return;
        const content = fs.readFileSync(file, "utf-8");
        const lines = content.split("\n").filter(Boolean);
        for (let i = this.outputOffset; i < lines.length; i++) {
            const pipeIdx = lines[i].indexOf("|");
            if (pipeIdx === -1)
                continue;
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
//# sourceMappingURL=signal-watcher.js.map