import Image from "next/image";
import Button from "@/components/ui/Button";
import {
  heroBackground,
  heroEyebrow,
  heroTitle,
  heroDescription,
  heroStats,
} from "@/data/hero";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Background image */}
      <Image
        src={heroBackground}
        alt="강남 스카이라인"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/90" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-between px-8 pt-24">
        <div className="max-w-2xl">
          <div className="mb-6 font-display text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
            {heroEyebrow}
          </div>
          <h1 className="mb-6 font-display text-6xl font-extrabold leading-[1.05] text-white md:text-7xl lg:text-[90px]">
            {heroTitle.line1}
            <br />
            <em className="text-gradient-primary not-italic">
              {heroTitle.line2}
            </em>
          </h1>
          <p className="mb-10 max-w-md text-lg leading-relaxed text-white/70">
            {heroDescription}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button as="a" href="#theme" variant="primary">
              코스 추천받기
            </Button>
            <Button as="a" href="#gallery" variant="outline">
              영상 보기
            </Button>
          </div>
        </div>

        {/* Side stats - hidden on tablet and below */}
        <div className="hidden flex-col gap-6 lg:flex">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="glass flex flex-col items-center rounded-2xl px-8 py-6"
            >
              <div className="font-display text-3xl font-extrabold text-white">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
