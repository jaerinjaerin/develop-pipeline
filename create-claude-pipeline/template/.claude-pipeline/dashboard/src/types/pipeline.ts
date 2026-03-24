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

export interface CheckpointInfo {
  phase: number;
  description: string;
  status: "pending" | "approved" | "rejected";
}

export interface PipelineSummary {
  id: string;
  requirements: string;
  status: PipelineState["status"];
  currentPhase: number;
  createdAt: string;
  agents: Record<string, AgentState>;
}

// WebSocket messages
export type ServerMessage =
  | { type: "pipeline:updated"; id: string; state: PipelineState }
  | { type: "pipeline:activity"; id: string; activity: Activity }
  | { type: "pipeline:checkpoint"; id: string; checkpoint: CheckpointInfo }
  | { type: "pipeline:removed"; id: string }
  | { type: "error"; message: string };

export type ClientMessage =
  | { type: "subscribe:all" }
  | { type: "subscribe"; pipelineId: string }
  | { type: "unsubscribe"; pipelineId: string }
  | { type: "checkpoint:respond"; pipelineId: string; action: "approve" | "reject"; message?: string };
