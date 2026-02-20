import { prisma } from "./prisma";

export async function getSpotsByTimeSlot(timeSlot: string) {
  return prisma.spot.findMany({
    where: { timeSlot },
    include: { category: true },
    take: 4,
  });
}

export async function getHotPlaces() {
  return prisma.spot.findMany({
    where: { isHotPlace: true },
    include: { category: true },
    take: 4,
  });
}

export async function getCourses() {
  return prisma.course.findMany({
    orderBy: { order: "asc" },
    take: 4,
  });
}

export async function getCourseDetail(id: number) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      courseSpots: {
        include: { spot: true },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getInfluencers() {
  return prisma.influencer.findMany({
    include: { tags: true },
    orderBy: { order: "asc" },
  });
}

export async function getFestivals() {
  return prisma.festival.findMany({
    where: { endDate: { gte: new Date() } },
    orderBy: { startDate: "asc" },
  });
}

export async function getFeaturedFestival() {
  return prisma.festival.findFirst({
    where: { isFeatured: true },
  });
}

export async function getGalleryItems() {
  return prisma.galleryItem.findMany({
    orderBy: { order: "asc" },
    take: 5,
  });
}

export async function getSpotDetail(id: number) {
  const spot = await prisma.spot.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!spot) return null;

  const relatedSpots = await prisma.spot.findMany({
    where: { categoryId: spot.categoryId, NOT: { id: spot.id } },
    include: { category: true },
    take: 3,
  });

  return { ...spot, relatedSpots };
}

export async function getCategories() {
  return prisma.category.findMany();
}
