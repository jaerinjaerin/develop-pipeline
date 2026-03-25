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
 * Watches for context file creation in TWO locations:
 * 1. pipelines/{id}/context/ — primary (dashboard-aware Claude)
 * 2. project-root/context/  — fallback (Claude ignoring dashboard instructions)
 *
 * When a file is found at project root, it's copied into the pipeline dir.
 */
export class ContextWatcher {
    stateManager;
    pipelineContextDir;
    rootContextDir;
    seenFiles = new Set();
    lastSignalTime = 0;
    intervals = [];
    pendingCopies = new Map();
    constructor(stateManager, pipelinesDir, pipelineId) {
        this.stateManager = stateManager;
        this.pipelineContextDir = path.join(pipelinesDir, pipelineId, "context");
        this.rootContextDir = path.join(pipelinesDir, "..", "context");
        // Restore seenFiles from existing state outputs to prevent duplicate processing on restart
        const state = stateManager.read();
        if (state) {
            for (const output of state.outputs) {
                const basename = path.basename(output.filename);
                this.seenFiles.add(basename);
            }
        }
    }
    notifySignalProcessed() {
        this.lastSignalTime = Date.now();
    }
    start() {
        fs.mkdirSync(this.pipelineContextDir, { recursive: true });
        // Scan existing files
        this.scanDir(this.pipelineContextDir);
        this.scanDir(this.rootContextDir);
        // Poll both directories
        this.intervals.push(setInterval(() => this.pollDirectory(this.pipelineContextDir, false), 2000), setInterval(() => this.pollDirectory(this.rootContextDir, true), 2000));
    }
    stop() {
        for (const interval of this.intervals) {
            clearInterval(interval);
        }
        this.intervals = [];
    }
    scanDir(dir) {
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                this.seenFiles.add(file);
            }
        }
        catch {
            // directory may not exist
        }
    }
    pollDirectory(dir, isRootFallback) {
        try {
            if (!fs.existsSync(dir))
                return;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                this.handleFile(file, dir, isRootFallback);
            }
        }
        catch {
            // directory may not exist yet
        }
    }
    handleFile(filename, sourceDir, isRootFallback) {
        if (this.seenFiles.has(filename))
            return;
        const filePath = path.join(sourceDir, filename);
        if (!fs.existsSync(filePath))
            return;
        this.seenFiles.add(filename);
        // If found at project root, copy to pipeline context dir
        if (isRootFallback) {
            const destPath = path.join(this.pipelineContextDir, filename);
            if (!fs.existsSync(destPath)) {
                try {
                    fs.copyFileSync(filePath, destPath);
                }
                catch {
                    // copy may fail if file is being written
                }
            }
        }
        // Skip state update if SignalWatcher was active recently
        if (Date.now() - this.lastSignalTime < 5000)
            return;
        const phase = CONTEXT_FILE_PHASES[filename];
        if (phase !== undefined) {
            this.stateManager.addOutput(`context/${filename}`, phase);
            this.stateManager.addActivity("system", "info", `산출물 감지: context/${filename} (Phase ${phase})${isRootFallback ? " [루트에서 복사됨]" : ""}`);
        }
    }
}
//# sourceMappingURL=context-watcher.js.map