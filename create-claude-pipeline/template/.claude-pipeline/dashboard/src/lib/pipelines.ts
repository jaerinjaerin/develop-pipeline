import fs from "fs";
import path from "path";
import type { PipelineState, PipelineSummary } from "@/types/pipeline";

const PIPELINES_DIR = process.env.PIPELINES_DIR;
if (!PIPELINES_DIR) {
  throw new Error("PIPELINES_DIR 환경변수가 설정되지 않았습니다. npx create-claude-pipeline으로 실행해주세요.");
}

export function getPipelinesDir(): string {
  return path.resolve(PIPELINES_DIR);
}

export function getPipelineDir(id: string): string {
  return path.join(getPipelinesDir(), id);
}

export function readPipelineState(id: string): PipelineState | null {
  const filePath = path.join(getPipelineDir(id), "state.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as PipelineState;
  } catch {
    return null;
  }
}

export function listPipelines(): PipelineSummary[] {
  const dir = getPipelinesDir();
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const summaries: PipelineSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const state = readPipelineState(entry.name);
    if (!state) continue;
    summaries.push({
      id: state.id,
      requirements: state.requirements,
      status: state.status,
      currentPhase: state.currentPhase,
      createdAt: state.createdAt,
      agents: state.agents,
    });
  }

  return summaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function readOutputFile(pipelineId: string, filepath: string): { content: string; contentType: string } | { error: "forbidden" } | { error: "not_found" } {
  const pipelineDir = getPipelineDir(pipelineId);
  const resolved = path.resolve(pipelineDir, filepath);

  if (!resolved.startsWith(path.resolve(pipelineDir))) {
    return { error: "forbidden" };
  }

  const state = readPipelineState(pipelineId);
  if (!state) return { error: "not_found" };

  const isRegistered = state.outputs.some((o) => o.filename === filepath);
  if (!isRegistered) return { error: "forbidden" };

  try {
    const content = fs.readFileSync(resolved, "utf-8");
    const ext = path.extname(filepath).toLowerCase();
    const contentType =
      ext === ".md" ? "text/markdown; charset=utf-8" :
      ext === ".html" ? "text/html; charset=utf-8" :
      "text/plain; charset=utf-8";
    return { content, contentType };
  } catch {
    return { error: "not_found" };
  }
}

export function writeCheckpointResponse(pipelineId: string, action: string, message?: string): boolean {
  const filePath = path.join(getPipelineDir(pipelineId), "checkpoint_response.json");
  try {
    fs.writeFileSync(filePath, JSON.stringify({
      action,
      message: message || "",
      timestamp: new Date().toISOString(),
    }));
    return true;
  } catch {
    return false;
  }
}
