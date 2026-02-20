"use client";

import { useState } from "react";
import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  sectionLabel,
  sectionTitle,
  sectionHighlight,
  visualImage,
  timeTabs,
  placesByTime,
} from "@/data/now-in-gangnam";

export default function NowInGangnam() {
  const [activeTab, setActiveTab] = useState(timeTabs[0].id);

  const places = placesByTime[activeTab];

  return (
    <section id="about" className="bg-surface px-8 py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          label={sectionLabel}
          title={sectionTitle}
          highlight={sectionHighlight}
          align="center"
        />

        <div className="flex flex-col gap-12 lg:flex-row">
          {/* Left visual */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl lg:w-1/2">
            <Image
              src={visualImage}
              alt="지금 강남은"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Right content */}
          <div className="flex flex-1 flex-col">
            {/* Tabs */}
            <div className="mb-8 flex gap-2">
              {timeTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "bg-white text-text-sub hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Place list */}
            <div className="flex flex-col gap-4">
              {places.map((place) => (
                <div
                  key={place.title}
                  className="flex items-center gap-5 rounded-2xl bg-white p-5 transition-shadow hover:shadow-lg"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={place.image}
                      alt={place.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="mb-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                      {place.tag}
                    </span>
                    <h3 className="text-base font-bold text-text-main">
                      {place.title}
                    </h3>
                    <p className="text-sm text-text-sub">{place.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
