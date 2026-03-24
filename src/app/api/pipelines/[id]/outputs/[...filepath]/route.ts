import { NextResponse } from "next/server";
import { readOutputFile } from "@/lib/pipelines";

export async function GET(_: Request, { params }: { params: { id: string; filepath: string[] } }) {
  const filepath = params.filepath.join("/");
  const result = readOutputFile(params.id, filepath);

  if ("error" in result) {
    if (result.error === "forbidden") {
      return NextResponse.json({ error: "File not registered in outputs" }, { status: 403 });
    }
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(result.content, {
    headers: { "Content-Type": result.contentType },
  });
}
