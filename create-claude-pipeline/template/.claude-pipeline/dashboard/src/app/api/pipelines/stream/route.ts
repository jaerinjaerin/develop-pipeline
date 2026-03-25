import { createSSEResponse } from "@/lib/sse";
import { listPipelines, readPipelineState, getPipelinesDir } from "@/lib/pipelines";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  return createSSEResponse((writer, signal) => {
    // Send initial pipeline list
    const pipelines = listPipelines();
    writer.write("pipeline:init", { pipelines });

    const pipelinesDir = getPipelinesDir();
    if (!fs.existsSync(pipelinesDir)) {
      fs.mkdirSync(pipelinesDir, { recursive: true });
    }

    // Track known pipeline state file mtimes for change detection
    const lastMtimes = new Map<string, number>();

    // Poll for changes (simpler and more reliable than fs.watch across platforms)
    const interval = setInterval(() => {
      if (signal.aborted) {
        clearInterval(interval);
        return;
      }

      try {
        const entries = fs.readdirSync(pipelinesDir, { withFileTypes: true });
        const currentIds = new Set<string>();

        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          currentIds.add(entry.name);

          const stateFile = path.join(pipelinesDir, entry.name, "state.json");
          try {
            const stat = fs.statSync(stateFile);
            const mtime = stat.mtimeMs;
            const prev = lastMtimes.get(entry.name);

            if (prev === undefined || prev !== mtime) {
              lastMtimes.set(entry.name, mtime);
              const state = readPipelineState(entry.name);
              if (state) {
                const { activities, ...summary } = state;
                writer.write("pipeline:updated", {
                  id: entry.name,
                  state: { ...summary, activitiesCount: activities.length },
                });
              }
            }
          } catch {
            // state.json doesn't exist yet
          }
        }

        // Detect removed pipelines
        for (const id of lastMtimes.keys()) {
          if (!currentIds.has(id)) {
            lastMtimes.delete(id);
            writer.write("pipeline:removed", { id });
          }
        }
      } catch {
        // pipelines dir may not exist yet
      }
    }, 1000);

    signal.addEventListener("abort", () => {
      clearInterval(interval);
      writer.close();
    });
  });
}
