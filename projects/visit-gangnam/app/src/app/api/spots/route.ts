import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const hotplace = searchParams.get("hotplace");
  const timeSlot = searchParams.get("timeSlot");

  const where: Record<string, unknown> = {};
  if (category) where.category = { slug: category };
  if (hotplace === "true") where.isHotPlace = true;
  if (timeSlot) where.timeSlot = timeSlot;

  try {
    const spots = await prisma.spot.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: spots, count: spots.length });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
