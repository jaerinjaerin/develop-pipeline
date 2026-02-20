import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  sectionLabel,
  sectionTitle,
  sectionHighlight,
  sectionDescription,
  themeCourses,
} from "@/data/theme-travel";

export default function ThemeTravel() {
  return (
    <section id="theme" className="bg-surface px-8 py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          label={sectionLabel}
          title={sectionTitle}
          highlight={sectionHighlight}
          description={sectionDescription}
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {themeCourses.map((course) => (
            <div
              key={course.course}
              className="group relative h-[400px] overflow-hidden rounded-3xl"
            >
              <Image
                src={course.image}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/85 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute bottom-8 left-8 right-8">
                <span className="mb-2 inline-block font-display text-xs font-semibold tracking-[0.2em] text-secondary">
                  {course.course}
                </span>
                <h3 className="mb-1 text-2xl font-bold text-white">
                  {course.title}
                </h3>
                <p className="mb-4 text-sm text-white/60">{course.info}</p>
                <a
                  href="#"
                  className="glass-light inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary hover:border-primary"
                >
                  코스 보기 →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
