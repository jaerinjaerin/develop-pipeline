import Image from "next/image";
import Badge from "@/components/ui/Badge";
import { featuredEvent, eventItems } from "@/data/events";

export default function Events() {
  return (
    <section id="events" className="bg-primary-dark px-8 py-24">
      <div className="mx-auto max-w-[1200px]">
        {/* Featured event hero */}
        <div className="relative mb-12 overflow-hidden rounded-3xl">
          <div className="relative h-[400px] md:h-[480px]">
            <Image
              src={featuredEvent.backgroundImage}
              alt={featuredEvent.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-primary-dark/75" />

            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
              <span className="mb-4 inline-block rounded-full bg-primary px-5 py-1.5 text-xs font-bold tracking-wider text-white uppercase">
                {featuredEvent.badge}
              </span>
              <h2 className="mb-4 font-display text-4xl font-extrabold text-white md:text-6xl lg:text-7xl">
                {featuredEvent.titleHtml.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </h2>
              <p className="mb-6 text-base text-white/60">
                {featuredEvent.date}
              </p>
              <a
                href="#"
                className="rounded-full bg-white px-8 py-3 text-sm font-bold text-primary-dark transition-colors hover:bg-primary hover:text-white"
              >
                자세히 보기
              </a>
            </div>
          </div>
        </div>

        {/* Sub event cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {eventItems.map((event) => (
            <div
              key={event.title}
              className="glass group overflow-hidden rounded-2xl"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6">
                <Badge type={event.badgeType}>{event.badge}</Badge>
                <h3 className="mt-3 text-lg font-bold text-white">
                  {event.title}
                </h3>
                <p className="mt-1 text-sm text-white/50">{event.dates}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
