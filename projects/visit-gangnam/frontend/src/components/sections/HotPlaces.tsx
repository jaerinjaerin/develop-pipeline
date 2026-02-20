import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  sectionLabel,
  sectionTitle,
  sectionHighlight,
  hotPlaces,
} from "@/data/hot-places";

export default function HotPlaces() {
  return (
    <section id="hotplaces" className="bg-white px-8 py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          label={sectionLabel}
          title={sectionTitle}
          highlight={sectionHighlight}
        />

        {/* Panel strip */}
        <div className="flex h-[500px] gap-3 max-md:flex-col max-md:h-auto">
          {hotPlaces.map((place) => (
            <div
              key={place.number}
              className="hot-panel group relative overflow-hidden rounded-2xl max-md:h-[200px]"
            >
              <Image
                src={place.image}
                alt={place.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 25vw"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Number */}
              <span className="absolute top-6 left-6 font-display text-6xl font-black text-white/10">
                {place.number}
              </span>

              {/* Content */}
              <div className="absolute bottom-6 left-6 right-6">
                <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {place.category}
                </span>
                <h3 className="text-lg font-bold text-white">{place.title}</h3>
                <p className="text-sm text-white/60">{place.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
