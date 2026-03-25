import type { StateManager } from "./state-manager.js";
/**
 * Watches for context file creation in TWO locations:
 * 1. pipelines/{id}/context/ — primary (dashboard-aware Claude)
 * 2. project-root/context/  — fallback (Claude ignoring dashboard instructions)
 *
 * When a file is found at project root, it's copied into the pipeline dir.
 */
export declare class ContextWatcher {
    private stateManager;
    private pipelineContextDir;
    private rootContextDir;
    private seenFiles;
    private lastSignalTime;
    private intervals;
    private pendingCopies;
    constructor(stateManager: StateManager, pipelinesDir: string, pipelineId: string);
    notifySignalProcessed(): void;
    start(): void;
    stop(): void;
    private scanDir;
    private pollDirectory;
    private handleFile;
}
