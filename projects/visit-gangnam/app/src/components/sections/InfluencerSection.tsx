import Image from "next/image";

interface InfluencerItem {
  id: number;
  name: string;
  handle: string;
  followers: string;
  avatarUrl: string | null;
  quote: string;
  description: string | null;
  imageUrl: string | null;
  tags: { id: number; name: string }[];
}

interface InfluencerSectionProps {
  influencers: InfluencerItem[];
}

export default function InfluencerSection({
  influencers,
}: InfluencerSectionProps) {
  return (
    <section className="py-[120px] px-20 bg-[var(--surface)] max-lg:py-20 max-lg:px-10 max-md:py-15 max-md:px-5">
      <div className="mb-16">
        <div className="font-montserrat text-[13px] font-bold text-[var(--secondary)] tracking-[3px] uppercase mb-4">
          Influencer Picks
        </div>
        <h2 className="text-5xl font-extrabold leading-[1.15] max-md:text-[32px]">
          인플루언서 <span className="text-[var(--primary)]">추천</span>
        </h2>
      </div>

      {influencers.map((influ, i) => (
        <div
          key={influ.id}
          className={`grid gap-12 items-center mb-16 last:mb-0 max-lg:grid-cols-1 ${
            i % 2 === 0
              ? "grid-cols-[1.2fr_1fr]"
              : "grid-cols-[1fr_1.2fr]"
          }`}
        >
          {/* Image - swap order on even */}
          <div
            className={`rounded-[20px] overflow-hidden h-[500px] ${
              i % 2 !== 0 ? "order-2 max-lg:order-1" : ""
            }`}
          >
            {influ.imageUrl && (
              <Image
                src={influ.imageUrl}
                alt={influ.name}
                width={800}
                height={500}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Body */}
          <div className={`p-5 ${i % 2 !== 0 ? "order-1 max-lg:order-2" : ""}`}>
            <div className="flex items-center gap-4 mb-6">
              {influ.avatarUrl && (
                <Image
                  src={influ.avatarUrl}
                  alt={influ.name}
                  width={56}
                  height={56}
                  className="rounded-full object-cover border-[3px] border-[var(--secondary)]"
                />
              )}
              <div>
                <div className="text-lg font-bold">{influ.name}</div>
                <div className="text-[13px] text-[var(--text-sub)]">
                  {influ.handle} &middot; {influ.followers}
                </div>
              </div>
            </div>

            <h3 className="text-[28px] font-bold leading-[1.4] mb-5 text-[var(--text)]">
              {influ.quote}
            </h3>

            {influ.description && (
              <p className="text-[15px] text-[var(--text-sub)] leading-[1.7] mb-6">
                {influ.description}
              </p>
            )}

            <div className="flex gap-2 flex-wrap">
              {influ.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-4 py-1.5 rounded-[30px] text-[13px] font-semibold bg-[rgba(0,201,167,0.1)] text-[var(--secondary)]"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
