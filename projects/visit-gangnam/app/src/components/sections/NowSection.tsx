"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface SpotItem {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  category: { name: string; slug: string };
}

interface NowSectionProps {
  morningSpots: SpotItem[];
  afternoonSpots: SpotItem[];
  eveningSpots: SpotItem[];
}

const TIME_TABS = [
  { key: "morning", label: "오전" },
  { key: "afternoon", label: "오후" },
  { key: "evening", label: "저녁" },
] as const;

export default function NowSection({
  morningSpots,
  afternoonSpots,
  eveningSpots,
}: NowSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("morning");
  const [visibleImage, setVisibleImage] = useState(
    morningSpots[0]?.imageUrl || ""
  );

  const spotsMap: Record<string, SpotItem[]> = {
    morning: morningSpots,
    afternoon: afternoonSpots,
    evening: eveningSpots,
  };

  const currentSpots = spotsMap[activeTab] || [];

  useEffect(() => {
    if (currentSpots[0]?.imageUrl) {
      setVisibleImage(currentSpots[0].imageUrl);
    }
  }, [activeTab]);

  return (
    <div
      id="now"
      className="grid grid-cols-2 min-h-[80vh] max-lg:grid-cols-1"
    >
      {/* Visual */}
      <div className="relative overflow-hidden max-lg:h-[400px]">
        {visibleImage && (
          <Image
            src={visibleImage}
            alt="강남 카페"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center p-20 bg-white max-md:p-5 max-md:px-5">
        <div className="mb-8">
          <div className="font-montserrat text-[13px] font-bold text-[var(--secondary)] tracking-[3px] uppercase mb-4">
            Now in Gangnam
          </div>
          <h2 className="text-4xl font-extrabold leading-[1.15]">
            지금 <span className="text-[var(--primary)]">강남</span>은
          </h2>
        </div>

        {/* Time Tabs */}
        <div className="flex border-b-2 border-[#eee] mb-10">
          {TIME_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-8 py-4 border-none bg-transparent text-base font-semibold cursor-pointer relative transition-colors duration-300 ${
                activeTab === tab.key
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-sub)]"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          ))}
        </div>

        {/* Spot List */}
        <div className="flex flex-col gap-5">
          {currentSpots.map((spot) => (
            <div
              key={spot.id}
              className="flex gap-5 p-5 rounded-[var(--radius)] cursor-pointer transition-colors duration-300 hover:bg-[var(--surface)]"
              onMouseEnter={() =>
                spot.imageUrl && setVisibleImage(spot.imageUrl)
              }
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                {spot.imageUrl && (
                  <Image
                    src={spot.imageUrl}
                    alt={spot.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <span className="inline-block px-2.5 py-[3px] bg-[rgba(0,201,167,0.12)] text-[var(--secondary)] rounded-[20px] text-[11px] font-bold mb-1.5">
                  {spot.category.name}
                </span>
                <div className="text-base font-bold mb-1">{spot.name}</div>
                <div className="text-[13px] text-[var(--text-sub)]">
                  {spot.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
