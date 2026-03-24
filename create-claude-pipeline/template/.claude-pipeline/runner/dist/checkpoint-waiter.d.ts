import type { CheckpointResponse } from "./types.js";
/**
 * Polls for checkpoint_response.json and resolves when the user responds.
 * Waits indefinitely until the file appears or the abort signal fires.
 */
export declare function waitForCheckpoint(pipelinesDir: string, pipelineId: string, signal?: AbortSignal): Promise<CheckpointResponse>;
