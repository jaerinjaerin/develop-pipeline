import type { TimeTab, Place } from "@/types";

export const sectionLabel = "Now in Gangnam";
export const sectionTitle = "지금 강남은";
export const sectionHighlight = "강남";

export const visualImage =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&q=80";

export const timeTabs: TimeTab[] = [
  { id: "morning", label: "오전" },
  { id: "afternoon", label: "오후" },
  { id: "evening", label: "저녁" },
];

export const placesByTime: Record<string, Place[]> = {
  morning: [
    {
      tag: "카페",
      title: "가로수길 브런치 카페",
      description: "모닝 커피와 함께하는 여유로운 아침",
      image:
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=80",
    },
    {
      tag: "힐링",
      title: "양재시민의숲 산책",
      description: "도심 속 초록빛 아침 산책 코스",
      image:
        "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=200&q=80",
    },
    {
      tag: "문화",
      title: "삼성미술관 리움",
      description: "오전에 만나는 세계적 컬렉션",
      image:
        "https://images.unsplash.com/photo-1537944434965-cf4679d1a598?w=200&q=80",
    },
  ],
  afternoon: [
    {
      tag: "쇼핑",
      title: "코엑스몰 쇼핑",
      description: "트렌디한 브랜드와 함께하는 오후",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80",
    },
    {
      tag: "문화",
      title: "봉은사 명상 체험",
      description: "도심 속 고즈넉한 전통 사찰",
      image:
        "https://images.unsplash.com/photo-1537944434965-cf4679d1a598?w=200&q=80",
    },
    {
      tag: "카페",
      title: "청담동 디저트 카페",
      description: "달콤한 오후의 여유",
      image:
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=80",
    },
  ],
  evening: [
    {
      tag: "야경",
      title: "한강 세빛섬",
      description: "화려한 야경이 펼쳐지는 저녁",
      image:
        "https://images.unsplash.com/photo-1517154421773-0529f569f283?w=200&q=80",
    },
    {
      tag: "맛집",
      title: "강남역 맛집 거리",
      description: "미식가들이 모이는 저녁 시간",
      image:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80",
    },
    {
      tag: "즐길거리",
      title: "압구정 루프탑 바",
      description: "강남의 밤을 즐기는 특별한 시간",
      image:
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=200&q=80",
    },
  ],
};
