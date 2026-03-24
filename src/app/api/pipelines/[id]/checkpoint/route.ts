import { NextResponse } from "next/server";
import { readPipelineState, writeCheckpointResponse } from "@/lib/pipelines";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const state = readPipelineState(params.id);
  if (!state) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }

  const body = await request.json();
  const { action, message } = body;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const success = writeCheckpointResponse(params.id, action, message);
  if (!success) {
    return NextResponse.json({ error: "Failed to write checkpoint response" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
