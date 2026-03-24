import { EventEmitter } from "events";
import type { StateManager } from "./state-manager.js";
interface SignalWatcherEvents {
    checkpoint: [phase: number, description: string];
    phase: [phase: number];
    error: [err: Error];
}
export declare class SignalWatcher extends EventEmitter<SignalWatcherEvents> {
    private stateManager;
    private signalsDir;
    private timer;
    private activityOffset;
    private outputOffset;
    constructor(stateManager: StateManager, pipelinesDir: string, pipelineId: string);
    start(intervalMs?: number): void;
    stop(): void;
    private poll;
    private processPhase;
    private processAgents;
    private processCheckpoint;
    private processActivities;
    private processOutputs;
}
export {};
