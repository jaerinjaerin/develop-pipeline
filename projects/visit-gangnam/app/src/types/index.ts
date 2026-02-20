export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface Spot {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  isHotPlace: boolean;
  timeSlot: string | null;
  category: Category;
  createdAt: string;
}

export interface SpotDetail extends Spot {
  content: string | null;
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  priceRange: string | null;
  mapUrl: string | null;
  relatedSpots: Spot[];
  updatedAt: string;
}

export interface Course {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  spotCount: number;
  duration: string | null;
  order: number;
}

export interface CourseSpotItem {
  order: number;
  travelTime: string | null;
  spot: Pick<Spot, "id" | "name" | "description" | "imageUrl">;
}

export interface CourseDetail extends Course {
  content: string | null;
  courseSpots: CourseSpotItem[];
}

export interface Festival {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  venue: string | null;
  isFeatured: boolean;
}

export interface Influencer {
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

export interface GalleryItem {
  id: number;
  type: "video" | "image";
  imageUrl: string;
  videoUrl: string | null;
  gridClass: string;
  order: number;
}

export interface ApiResponse<T> {
  data: T;
  count?: number;
}

export interface ApiError {
  error: string;
}
