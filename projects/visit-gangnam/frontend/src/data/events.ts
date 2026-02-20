import type { EventItem, FeaturedEvent } from "@/types";

export const sectionLabel = "Festival & Events";
export const sectionTitle = "축제/행사";

export const featuredEvent: FeaturedEvent = {
  backgroundImage:
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80",
  badge: "COMING SOON",
  title: "2026 GANGNAM FESTIVAL",
  titleHtml: "2026\nGANGNAM FESTIVAL",
  date: "2026.04.01 - 04.15 | 코엑스 일대",
};

export const eventItems: EventItem[] = [
  {
    badge: "예정",
    badgeType: "soon",
    title: "강남 K-POP 콘서트",
    dates: "2026.05.10 - 05.12",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
  },
  {
    badge: "예정",
    badgeType: "soon",
    title: "아트 강남 2026",
    dates: "2026.06.01 - 06.30",
    image:
      "https://images.unsplash.com/photo-1569863959165-56dae551d4fc?w=600&q=80",
  },
  {
    badge: "예정",
    badgeType: "soon",
    title: "강남 미식 위크",
    dates: "2026.07.01 - 07.14",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
  },
];
