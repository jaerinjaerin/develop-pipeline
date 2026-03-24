import fs from "fs";
import path from "path";
/**
 * Polls for checkpoint_response.json and resolves when the user responds.
 * Waits indefinitely until the file appears or the abort signal fires.
 */
export function waitForCheckpoint(pipelinesDir, pipelineId, signal) {
    const filePath = path.join(pipelinesDir, pipelineId, "checkpoint_response.json");
    const POLL_INTERVAL_MS = 2000;
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new Error("Aborted"));
            return;
        }
        const timer = setInterval(() => {
            try {
                if (!fs.existsSync(filePath))
                    return;
                const raw = fs.readFileSync(filePath, "utf-8");
                const response = JSON.parse(raw);
                // Delete the file after reading
                try {
                    fs.unlinkSync(filePath);
                }
                catch {
                    // ignore delete errors
                }
                clearInterval(timer);
                resolve(response);
            }
            catch {
                // JSON parse error or read error — file may be mid-write, retry next poll
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
//# sourceMappingURL=checkpoint-waiter.js.map