import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSpotDetail } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const spot = await getSpotDetail(parseInt(id, 10));
  if (!spot) return { title: "스팟을 찾을 수 없습니다" };
  return {
    title: `${spot.name} - VISIT GANGNAM`,
    description: spot.description,
    openGraph: {
      title: `${spot.name} - VISIT GANGNAM`,
      description: spot.description,
      images: spot.imageUrl ? [spot.imageUrl] : [],
    },
  };
}

export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spotId = parseInt(id, 10);
  if (isNaN(spotId)) notFound();

  const spot = await getSpotDetail(spotId);
  if (!spot) notFound();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px]">
        {spot.imageUrl && (
          <Image
            src={spot.imageUrl}
            alt={spot.name}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        <div className="absolute bottom-10 left-20 z-[2] max-md:left-5 max-md:bottom-8">
          <span className="inline-block px-3 py-1 bg-[rgba(0,201,167,0.15)] text-[var(--secondary)] rounded-full text-xs font-bold mb-3">
            {spot.category.icon} {spot.category.name}
          </span>
          <h1 className="text-5xl font-extrabold text-white mb-2 max-md:text-3xl">
            {spot.name}
          </h1>
          <p className="text-lg text-white/70">{spot.description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-10 py-16 max-md:px-5">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-6 mb-12 max-md:grid-cols-1">
          {spot.address && (
            <InfoItem label="주소" value={spot.address} />
          )}
          {spot.phone && <InfoItem label="전화" value={spot.phone} />}
          {spot.openingHours && (
            <InfoItem label="운영시간" value={spot.openingHours} />
          )}
          {spot.priceRange && (
            <InfoItem label="가격대" value={spot.priceRange} />
          )}
          {spot.website && (
            <div>
              <div className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-[1px] mb-1">
                웹사이트
              </div>
              <a
                href={spot.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] font-medium hover:underline"
              >
                {spot.website}
              </a>
            </div>
          )}
        </div>

        {/* Body */}
        {spot.content && (
          <div className="text-base leading-[1.8] text-[var(--text)] mb-16">
            {spot.content}
          </div>
        )}

        {/* Related Spots */}
        {spot.relatedSpots.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">관련 장소</h2>
            <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
              {spot.relatedSpots.map((rs) => (
                <Link
                  key={rs.id}
                  href={`/spots/${rs.id}`}
                  className="group rounded-[var(--radius)] overflow-hidden block no-underline"
                >
                  <div className="relative h-[180px]">
                    {rs.imageUrl && (
                      <Image
                        src={rs.imageUrl}
                        alt={rs.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-4 bg-[var(--surface)]">
                    <div className="font-bold text-[var(--text)]">
                      {rs.name}
                    </div>
                    <div className="text-sm text-[var(--text-sub)]">
                      {rs.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-[1px] mb-1">
        {label}
      </div>
      <div className="text-base text-[var(--text)]">{value}</div>
    </div>
  );
}
