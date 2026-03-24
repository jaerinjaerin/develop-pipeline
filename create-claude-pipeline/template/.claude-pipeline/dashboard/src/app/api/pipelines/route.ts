import { NextResponse } from "next/server";
import { listPipelines, getPipelinesDir } from "@/lib/pipelines";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

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

    // Spawn CLI process (fire-and-forget)
    try {
      const child = spawn("claude", [requirements.trim()], {
        cwd: path.resolve(process.cwd(), ".."),
        detached: true,
        stdio: "ignore",
        env: { ...process.env, PIPELINE_ID: id },
      });
      child.unref();
    } catch (e) {
      console.error("Failed to spawn CLI:", e);
    }

    return NextResponse.json({ id, status: "running" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to start pipeline process" }, { status: 500 });
  }
}
