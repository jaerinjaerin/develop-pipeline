import { NextResponse } from "next/server";
import { listPipelines, getPipelinesDir } from "@/lib/pipelines";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { spawn, execSync } from "child_process";

export async function GET() {
  try {
    const pipelines = listPipelines();
    return NextResponse.json({ pipelines });
  } catch {
    return NextResponse.json({ error: "Failed to read pipelines directory" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requirements } = body;

    if (!requirements || !requirements.trim()) {
      return NextResponse.json({ error: "Requirements is required" }, { status: 400 });
    }

    // Pre-check: Claude CLI available?
    try {
      execSync("claude --version", { timeout: 10000, stdio: "pipe" });
    } catch {
      return NextResponse.json(
        { error: "Claude CLI를 찾을 수 없거나 로그인되어 있지 않습니다. `claude --version`을 확인해주세요." },
        { status: 503 },
      );
    }

    const id = uuidv4();
    const pipelineDir = path.join(getPipelinesDir(), id);
    fs.mkdirSync(pipelineDir, { recursive: true });

    const initialState = {
      id,
      name: `Pipeline ${id.slice(0, 8)}`,
      requirements: requirements.trim(),
      status: "running",
      currentPhase: 0,
      agents: {},
      outputs: [],
      activities: [],
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(pipelineDir, "state.json"),
      JSON.stringify(initialState, null, 2)
    );

    // Spawn pipeline-runner
    const projectRoot = path.resolve(process.cwd(), "..", "..");
    const runnerScript = path.resolve(
      projectRoot, ".claude-pipeline", "runner", "dist", "pipeline-runner.js",
    );

    let child;
    try {
      child = spawn("node", [runnerScript], {
        cwd: projectRoot,
        detached: true,
        stdio: "ignore",
        env: {
          ...process.env,
          PIPELINE_ID: id,
          PIPELINES_DIR: getPipelinesDir(),
          PIPELINE_REQUIREMENTS: requirements.trim(),
        },
      });
      child.unref();
    } catch (e) {
      const failedState = { ...initialState, status: "failed" };
      fs.writeFileSync(
        path.join(pipelineDir, "state.json"),
        JSON.stringify(failedState, null, 2)
      );
      console.error("Failed to spawn pipeline runner:", e);
      return NextResponse.json(
        { id, status: "failed", error: "Runner 실행 실패" },
        { status: 500 },
      );
    }

    if (child.pid) {
      fs.writeFileSync(path.join(pipelineDir, "runner.pid"), String(child.pid));
    }

    return NextResponse.json({ id, status: "running" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to start pipeline process" }, { status: 500 });
  }
}
