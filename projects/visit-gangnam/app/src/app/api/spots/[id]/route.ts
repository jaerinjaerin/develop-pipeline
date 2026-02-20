import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const spotId = parseInt(id, 10);
  if (isNaN(spotId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { category: true },
    });

    if (!spot) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    const relatedSpots = await prisma.spot.findMany({
      where: { categoryId: spot.categoryId, NOT: { id: spot.id } },
      include: { category: true },
      take: 3,
    });

    return NextResponse.json({ data: { ...spot, relatedSpots } });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
