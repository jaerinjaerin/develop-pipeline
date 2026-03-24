import type { Activity, CheckpointInfo } from "@/types/pipeline";

export function detectCheckpoint(activities: Activity[]): CheckpointInfo | null {
  let lastCheckpointIdx = -1;
  let checkpointPhase = 0;
  let checkpointDesc = "";

  for (let i = activities.length - 1; i >= 0; i--) {
    const a = activities[i];
    if (a.agentId === "system" && a.message.includes("Checkpoint")) {
      if (a.message.includes("approved") || a.message.includes("rejected")) {
        return null;
      }
      lastCheckpointIdx = i;
      checkpointDesc = a.message;
      const phaseMatch = a.message.match(/Phase (\d+)/);
      if (phaseMatch) checkpointPhase = parseInt(phaseMatch[1]);
      break;
    }
  }

  if (lastCheckpointIdx === -1) return null;

  for (let i = lastCheckpointIdx + 1; i < activities.length; i++) {
    const a = activities[i];
    if (a.agentId === "system") {
      if (a.message.includes("Checkpoint approved")) return null;
      if (a.message.includes("Checkpoint rejected")) return null;
    }
  }

  return {
    phase: checkpointPhase,
    description: checkpointDesc,
    status: "pending",
  };
}
