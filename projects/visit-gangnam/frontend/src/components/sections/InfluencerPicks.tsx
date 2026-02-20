import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  sectionLabel,
  sectionTitle,
  sectionHighlight,
  influencerPicks,
} from "@/data/influencer-picks";

export default function InfluencerPicks() {
  return (
    <section id="influencer" className="bg-white px-8 py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          label={sectionLabel}
          title={sectionTitle}
          highlight={sectionHighlight}
        />

        <div className="flex flex-col gap-24">
          {influencerPicks.map((pick, idx) => {
            const isEven = idx % 2 === 1;
            return (
              <div
                key={pick.name}
                className={`flex flex-col items-center gap-12 lg:flex-row ${isEven ? "lg:flex-row-reverse" : ""}`}
              >
                {/* Feature image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:w-1/2">
                  <Image
                    src={pick.featureImage}
                    alt={pick.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>

                {/* Text content */}
                <div className="flex flex-1 flex-col">
                  {/* Avatar and info */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full">
                      <Image
                        src={pick.avatar}
                        alt={pick.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-text-main">
                        {pick.name}
                      </div>
                      <div className="text-sm text-text-sub">{pick.handle}</div>
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="mb-6 text-2xl font-bold leading-snug text-text-main lg:text-3xl">
                    &ldquo;
                    {pick.quote.split(pick.quoteHighlight).map((part, i) => (
                      <span key={i}>
                        {part}
                        {i === 0 && (
                          <span className="text-gradient-primary">
                            {pick.quoteHighlight}
                          </span>
                        )}
                      </span>
                    ))}
                    &rdquo;
                  </blockquote>

                  <p className="mb-6 text-base leading-relaxed text-text-sub">
                    {pick.description}
                  </p>

                  {/* Tags */}
                  <div className="flex gap-2">
                    {pick.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-text-sub"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
