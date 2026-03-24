import type { StateManager } from "./state-manager.js";
/**
 * Fallback watcher: monitors the context/ directory for file creation.
 * Only updates state when SignalWatcher hasn't reported recently.
 */
export declare class ContextWatcher {
    private stateManager;
    private contextDir;
    private watcher;
    private seenFiles;
    private lastSignalTime;
    constructor(stateManager: StateManager, pipelinesDir: string, pipelineId: string);
    /** Call this whenever SignalWatcher processes a signal */
    notifySignalProcessed(): void;
    start(): void;
    stop(): void;
    private handleFile;
    private pollDirectory;
}
