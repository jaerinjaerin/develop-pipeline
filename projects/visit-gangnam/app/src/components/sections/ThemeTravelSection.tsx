import Image from "next/image";
import Link from "next/link";

interface CourseItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  spotCount: number;
  duration: string | null;
  order: number;
}

interface ThemeTravelSectionProps {
  courses: CourseItem[];
}

export default function ThemeTravelSection({
  courses,
}: ThemeTravelSectionProps) {
  return (
    <section id="theme" className="py-[120px] px-20 bg-white max-lg:py-20 max-lg:px-10 max-md:py-15 max-md:px-5">
      <div className="mb-16">
        <div className="font-montserrat text-[13px] font-bold text-[var(--secondary)] tracking-[3px] uppercase mb-4">
          Theme Travel
        </div>
        <h2 className="text-5xl font-extrabold leading-[1.15] mb-4 max-md:text-[32px]">
          테마별 <span className="text-[var(--primary)]">여행코스</span>
        </h2>
        <p className="text-[17px] text-[var(--text-sub)] max-w-[500px] leading-[1.7]">
          취향에 맞는 강남만의 특별한 여행 코스
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="group relative rounded-[20px] overflow-hidden h-[400px] cursor-pointer block no-underline"
          >
            {course.imageUrl && (
              <Image
                src={course.imageUrl}
                alt={course.name}
                fill
                className="object-cover transition-transform duration-600 group-hover:scale-[1.06]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(27,31,59,0.85)] flex flex-col justify-end p-10">
              <div className="font-montserrat text-sm font-bold text-[var(--secondary)] mb-3 tracking-[2px]">
                COURSE {String(course.order).padStart(2, "0")}
              </div>
              <h3 className="text-[28px] font-extrabold text-white mb-2">
                {course.name}
              </h3>
              <div className="text-sm text-white/60">
                {course.spotCount}개 스팟 &middot; {course.duration}
              </div>
              <span className="inline-flex items-center gap-2 mt-5 px-6 py-3 glass-light rounded-[50px] text-white text-sm font-semibold w-fit transition-all duration-300 group-hover:bg-[var(--primary)] group-hover:border-[var(--primary)]">
                코스 보기 &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
