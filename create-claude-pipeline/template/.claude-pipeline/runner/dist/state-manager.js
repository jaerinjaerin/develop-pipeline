import fs from "fs";
import path from "path";
import crypto from "crypto";
const MAX_ACTIVITIES = 200;
export class StateManager {
    stateFile;
    pipelineDir;
    constructor(pipelinesDir, pipelineId) {
        this.pipelineDir = path.join(pipelinesDir, pipelineId);
        this.stateFile = path.join(this.pipelineDir, "state.json");
    }
    read() {
        try {
            const raw = fs.readFileSync(this.stateFile, "utf-8");
            return JSON.parse(raw);
        }
        catch {
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
    update(updater) {
        const state = this.read();
        if (!state)
            throw new Error(`Cannot read state: ${this.stateFile}`);
        const updated = updater(state);
        const tmpFile = path.join(this.pipelineDir, `.state.tmp.${Date.now()}`);
        fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2));
        try {
            fs.renameSync(tmpFile, this.stateFile);
        }
        catch (err) {
            try {
                fs.unlinkSync(tmpFile);
            }
            catch { /* ignore */ }
            throw err;
        }
    }
    setStatus(status) {
        this.update((s) => ({ ...s, status }));
    }
    setPhase(phase) {
        this.update((s) => ({ ...s, currentPhase: phase }));
    }
    setAgentStatus(agentId, status, currentTask) {
        this.update((s) => ({
            ...s,
            agents: {
                ...s.agents,
                [agentId]: { id: agentId, status, currentTask },
            },
        }));
    }
    addActivity(agentId, type, message) {
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
    addOutput(filename, phase) {
        this.update((s) => {
            const exists = s.outputs.some((o) => o.filename === filename);
            if (exists)
                return s;
            return {
                ...s,
                outputs: [
                    ...s.outputs,
                    {
                        filename,
                        status: "complete",
                        phase,
                        updatedAt: new Date().toISOString(),
                    },
                ],
            };
        });
    }
}
//# sourceMappingURL=state-manager.js.map