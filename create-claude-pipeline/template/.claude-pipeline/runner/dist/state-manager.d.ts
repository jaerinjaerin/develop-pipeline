import type { PipelineState, Activity, AgentState } from "./types.js";
export declare class StateManager {
    private stateFile;
    private pipelineDir;
    constructor(pipelinesDir: string, pipelineId: string);
    read(): PipelineState | null;
    /** Atomic update: read → modify → write via temp file + rename */
    update(updater: (state: PipelineState) => PipelineState): void;
    setStatus(status: PipelineState["status"]): void;
    setPhase(phase: number): void;
    setAgentStatus(agentId: string, status: AgentState["status"], currentTask?: string): void;
    addActivity(agentId: string, type: Activity["type"], message: string): void;
    addOutput(filename: string, phase: number): void;
}
