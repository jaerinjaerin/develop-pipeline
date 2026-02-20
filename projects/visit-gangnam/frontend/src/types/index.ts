export interface NavItem {
  label: string;
  href: string;
}

export interface HeroStat {
  value: string;
  label: string;
}

export interface TimeTab {
  id: string;
  label: string;
}

export interface Place {
  tag: string;
  title: string;
  description: string;
  image: string;
}

export interface HotPlace {
  number: string;
  category: string;
  title: string;
  sub: string;
  image: string;
}

export interface ThemeCourse {
  course: string;
  title: string;
  info: string;
  image: string;
}

export interface InfluencerPick {
  featureImage: string;
  avatar: string;
  name: string;
  handle: string;
  quote: string;
  quoteHighlight: string;
  description: string;
  tags: string[];
}

export interface EventItem {
  badge: string;
  badgeType: "live" | "soon";
  title: string;
  dates: string;
  image: string;
}

export interface FeaturedEvent {
  backgroundImage: string;
  badge: string;
  title: string;
  titleHtml: string;
  date: string;
}

export interface GalleryItem {
  image: string;
  className: string;
  isVideo?: boolean;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}
