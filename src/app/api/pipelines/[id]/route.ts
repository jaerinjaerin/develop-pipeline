import { NextResponse } from "next/server";
import { readPipelineState } from "@/lib/pipelines";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const state = readPipelineState(params.id);
  if (!state) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }
  return NextResponse.json(state);
}
