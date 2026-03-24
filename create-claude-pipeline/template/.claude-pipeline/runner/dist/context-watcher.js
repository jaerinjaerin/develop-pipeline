import fs from "fs";
import path from "path";
/** Maps context file patterns to estimated phase completion */
const CONTEXT_FILE_PHASES = {
    "00_requirements.md": 0,
    "01_plan.md": 1,
    "01_plan.html": 1,
    "02_design_spec.md": 2,
    "03_api_spec.md": 2,
    "03_erd.md": 2,
    "04_task_FE.md": 3,
    "04_task_BE.md": 3,
    "04_task_INFRA.md": 3,
    "04_task_QA.md": 4,
    "04_task_SEC.md": 4,
    "04_task_REVIEW.md": 4,
    "qa_report.md": 4,
    "security_report.md": 4,
};
/**
 * Fallback watcher: monitors the context/ directory for file creation.
 * Only updates state when SignalWatcher hasn't reported recently.
 */
export class ContextWatcher {
    stateManager;
    contextDir;
    watcher = null;
    seenFiles = new Set();
    lastSignalTime = 0;
    constructor(stateManager, pipelinesDir, pipelineId) {
        this.stateManager = stateManager;
        this.contextDir = path.join(pipelinesDir, pipelineId, "context");
    }
    /** Call this whenever SignalWatcher processes a signal */
    notifySignalProcessed() {
        this.lastSignalTime = Date.now();
    }
    start() {
        fs.mkdirSync(this.contextDir, { recursive: true });
        // Scan existing files first
        try {
            const existing = fs.readdirSync(this.contextDir);
            for (const file of existing) {
                this.seenFiles.add(file);
            }
        }
        catch {
            // directory might not exist yet
        }
        try {
            this.watcher = fs.watch(this.contextDir, (eventType, filename) => {
                if (eventType !== "rename" || !filename)
                    return;
                this.handleFile(filename);
            });
        }
        catch {
            // fs.watch may fail on some systems, fall back to polling
            setInterval(() => this.pollDirectory(), 3000);
        }
    }
    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
    handleFile(filename) {
        if (this.seenFiles.has(filename))
            return;
        // Check if file actually exists (rename events fire on delete too)
        const filePath = path.join(this.contextDir, filename);
        if (!fs.existsSync(filePath))
            return;
        this.seenFiles.add(filename);
        // Skip if SignalWatcher was active in the last 5 seconds
        if (Date.now() - this.lastSignalTime < 5000)
            return;
        const phase = CONTEXT_FILE_PHASES[filename];
        if (phase !== undefined) {
            this.stateManager.addOutput(`context/${filename}`, phase);
            this.stateManager.addActivity("system", "info", `산출물 감지: context/${filename} (Phase ${phase})`);
        }
    }
    pollDirectory() {
        try {
            const files = fs.readdirSync(this.contextDir);
            for (const file of files) {
                this.handleFile(file);
            }
        }
        catch {
            // directory may not exist yet
        }
    }
}
//# sourceMappingURL=context-watcher.js.map