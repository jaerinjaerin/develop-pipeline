import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCourseDetail } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseDetail(parseInt(id, 10));
  if (!course) return { title: "코스를 찾을 수 없습니다" };
  return {
    title: `${course.name} - VISIT GANGNAM`,
    description: course.description,
    openGraph: {
      title: `${course.name} - VISIT GANGNAM`,
      description: course.description,
      images: course.imageUrl ? [course.imageUrl] : [],
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = parseInt(id, 10);
  if (isNaN(courseId)) notFound();

  const course = await getCourseDetail(courseId);
  if (!course) notFound();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[350px]">
        {course.imageUrl && (
          <Image
            src={course.imageUrl}
            alt={course.name}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-[rgba(27,31,59,0.85)]" />
        <div className="absolute bottom-10 left-20 z-[2] max-md:left-5 max-md:bottom-8">
          <div className="font-montserrat text-sm font-bold text-[var(--secondary)] tracking-[2px] mb-3">
            COURSE {String(course.order).padStart(2, "0")}
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-2 max-md:text-3xl">
            {course.name}
          </h1>
          <p className="text-lg text-white/70">
            {course.spotCount}개 스팟 &middot; {course.duration}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-10 py-16 max-md:px-5">
        {course.content && (
          <p className="text-base leading-[1.8] text-[var(--text)] mb-12">
            {course.content}
          </p>
        )}

        {/* Course Spots Timeline */}
        <h2 className="text-2xl font-bold mb-8">코스 스팟</h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--surface)]" />

          {course.courseSpots.map((cs, i) => (
            <div key={cs.id} className="relative pl-16 pb-10 last:pb-0">
              {/* Dot */}
              <div className="absolute left-[18px] top-1 w-3.5 h-3.5 rounded-full bg-[var(--primary)] border-2 border-white" />

              {/* Travel time */}
              {cs.travelTime && i > 0 && (
                <div className="absolute left-14 -top-5 text-xs text-[var(--text-sub)] bg-white px-2">
                  {cs.travelTime}
                </div>
              )}

              <Link
                href={`/spots/${cs.spot.id}`}
                className="group flex gap-4 p-4 rounded-[var(--radius)] transition-colors duration-300 hover:bg-[var(--surface)] no-underline"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  {cs.spot.imageUrl && (
                    <Image
                      src={cs.spot.imageUrl}
                      alt={cs.spot.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <div className="font-montserrat text-xs font-bold text-[var(--secondary)] mb-1">
                    SPOT {String(cs.order).padStart(2, "0")}
                  </div>
                  <div className="text-lg font-bold text-[var(--text)] mb-1">
                    {cs.spot.name}
                  </div>
                  <div className="text-sm text-[var(--text-sub)]">
                    {cs.spot.description}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
