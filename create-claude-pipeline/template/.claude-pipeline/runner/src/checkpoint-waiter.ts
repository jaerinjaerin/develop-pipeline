import fs from "fs";
import path from "path";
import type { CheckpointResponse } from "./types.js";

/**
 * Polls for checkpoint_response.json and resolves when the user responds.
 * Waits indefinitely until the file appears or the abort signal fires.
 */
export function waitForCheckpoint(
  pipelinesDir: string,
  pipelineId: string,
  expectedPhase: number,
  signal?: AbortSignal,
): Promise<CheckpointResponse> {
  const filePath = path.join(pipelinesDir, pipelineId, "checkpoint_response.json");
  const POLL_INTERVAL_MS = 2000;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Aborted"));
      return;
    }

    const timer = setInterval(() => {
      try {
        if (!fs.existsSync(filePath)) return;

        const claimedPath = filePath + ".processing";
        try {
          fs.renameSync(filePath, claimedPath);
        } catch {
          return;
        }

        const raw = fs.readFileSync(claimedPath, "utf-8");
        const response = JSON.parse(raw) as CheckpointResponse;

        fs.unlinkSync(claimedPath);

        if (response.phase !== undefined && response.phase !== expectedPhase) {
          console.log(`[Runner] Discarding orphan checkpoint response for phase ${response.phase} (expected ${expectedPhase})`);
          return;
        }

        clearInterval(timer);
        resolve(response);
      } catch {
        const claimedPath = filePath + ".processing";
        try { fs.unlinkSync(claimedPath); } catch { /* ignore */ }
      }
    }, POLL_INTERVAL_MS);

    if (signal) {
      signal.addEventListener("abort", () => {
        clearInterval(timer);
        reject(new Error("Aborted"));
      }, { once: true });
    }
  });
}
