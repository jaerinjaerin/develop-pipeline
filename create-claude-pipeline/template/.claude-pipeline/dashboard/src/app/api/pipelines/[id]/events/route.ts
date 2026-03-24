import { createSSEResponse } from "@/lib/sse";
import { readPipelineState, getPipelineDir } from "@/lib/pipelines";
import { detectCheckpoint } from "@/lib/checkpoint";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const pipelineDir = getPipelineDir(id);

  if (!fs.existsSync(pipelineDir)) {
    return new Response(JSON.stringify({ error: "Pipeline not found" }), {
      status: 404,
    });
  }

  return createSSEResponse((writer, signal) => {
    let prevActivitiesCount = 0;
    let lastMtime = 0;

    // Send initial state
    const initialState = readPipelineState(id);
    if (initialState) {
      writer.write("pipeline:updated", { id, state: initialState });
      prevActivitiesCount = initialState.activities.length;

      const checkpoint = detectCheckpoint(initialState.activities);
      if (checkpoint) {
        writer.write("pipeline:checkpoint", { id, checkpoint });
      }
    }

    // Poll state.json for changes
    const stateFile = path.join(pipelineDir, "state.json");

    const interval = setInterval(() => {
      if (signal.aborted) {
        clearInterval(interval);
        return;
      }

      try {
        const stat = fs.statSync(stateFile);
        if (stat.mtimeMs === lastMtime) return;
        lastMtime = stat.mtimeMs;

        const state = readPipelineState(id);
        if (!state) return;

        // Send full state update
        writer.write("pipeline:updated", { id, state });

        // Send new activities individually
        const newActivities = state.activities.slice(prevActivitiesCount);
        for (const activity of newActivities) {
          writer.write("pipeline:activity", { id, activity });
        }
        prevActivitiesCount = state.activities.length;

        // Check for checkpoint
        const checkpoint = detectCheckpoint(state.activities);
        if (checkpoint) {
          writer.write("pipeline:checkpoint", { id, checkpoint });
        }
      } catch {
        // state.json may be mid-write or pipeline removed
        if (!fs.existsSync(pipelineDir)) {
          writer.write("pipeline:removed", { id });
          clearInterval(interval);
          writer.close();
        }
      }
    }, 500);

    signal.addEventListener("abort", () => {
      clearInterval(interval);
      writer.close();
    });
  });
}
