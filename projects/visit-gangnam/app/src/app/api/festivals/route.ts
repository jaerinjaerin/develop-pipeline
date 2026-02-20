import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const featured = searchParams.get("featured");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (featured === "true") where.isFeatured = true;

  const now = new Date();
  if (status === "live") {
    where.startDate = { lte: now };
    where.endDate = { gte: now };
  } else if (status === "soon") {
    where.startDate = { gt: now };
  } else if (status === "ended") {
    where.endDate = { lt: now };
  }

  try {
    const festivals = await prisma.festival.findMany({
      where,
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json({ data: festivals, count: festivals.length });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
