export interface PipelineState {
  id: string;
  name: string;
  requirements: string;
  status: "running" | "completed" | "failed" | "paused";
  currentPhase: number;
  agents: Record<string, AgentState>;
  outputs: OutputEntry[];
  activities: Activity[];
  createdAt: string;
}

export interface AgentState {
  id: string;
  status: "idle" | "working" | "done";
  currentTask?: string;
}

export interface OutputEntry {
  filename: string;
  status: "complete";
  phase: number;
  updatedAt: string;
}

export interface Activity {
  id: string;
  agentId: string;
  message: string;
  timestamp: string;
  type: "info" | "success" | "error" | "progress";
}

export interface CheckpointResponse {
  action: "approve" | "reject";
  message: string;
  timestamp: string;
}
