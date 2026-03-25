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
      const { activities: initialActivities, ...initialMeta } = initialState;
      writer.write("pipeline:updated", { id, state: { ...initialMeta, activitiesCount: initialActivities.length } });
      for (const activity of initialActivities) {
        writer.write("pipeline:activity", { id, activity });
      }
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

        // Send full state update (without activities array)
        const { activities, ...stateMeta } = state;
        writer.write("pipeline:updated", { id, state: { ...stateMeta, activitiesCount: activities.length } });

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

        if (state.status === "running" || state.status === "paused") {
          const heartbeatPath = path.join(pipelineDir, "heartbeat");
          try {
            const hbStat = fs.statSync(heartbeatPath);
            const staleMs = Date.now() - hbStat.mtimeMs;
            if (staleMs > 30_000) {
              writer.write("pipeline:runner_stale", {
                id,
                lastHeartbeat: hbStat.mtimeMs,
                staleMs,
              });
            }
          } catch {
            // heartbeat file doesn't exist — old runner or not started yet
          }
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
