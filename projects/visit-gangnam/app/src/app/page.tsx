import HeroSection from "@/components/sections/HeroSection";
import NowSection from "@/components/sections/NowSection";
import HotPlacesSection from "@/components/sections/HotPlacesSection";
import ThemeTravelSection from "@/components/sections/ThemeTravelSection";
import InfluencerSection from "@/components/sections/InfluencerSection";
import FestivalSection from "@/components/sections/FestivalSection";
import GallerySection from "@/components/sections/GallerySection";
import {
  getSpotsByTimeSlot,
  getHotPlaces,
  getCourses,
  getInfluencers,
  getFeaturedFestival,
  getFestivals,
  getGalleryItems,
} from "@/lib/queries";

export default async function Home() {
  const [
    morningSpots,
    afternoonSpots,
    eveningSpots,
    hotPlaces,
    courses,
    influencers,
    featuredFestival,
    festivals,
    galleryItems,
  ] = await Promise.all([
    getSpotsByTimeSlot("morning"),
    getSpotsByTimeSlot("afternoon"),
    getSpotsByTimeSlot("evening"),
    getHotPlaces(),
    getCourses(),
    getInfluencers(),
    getFeaturedFestival(),
    getFestivals(),
    getGalleryItems(),
  ]);

  return (
    <>
      <HeroSection />
      <NowSection
        morningSpots={morningSpots}
        afternoonSpots={afternoonSpots}
        eveningSpots={eveningSpots}
      />
      <HotPlacesSection spots={hotPlaces} />
      <ThemeTravelSection courses={courses} />
      <InfluencerSection influencers={influencers} />
      <FestivalSection featured={featuredFestival} festivals={festivals} />
      <GallerySection items={galleryItems} />
    </>
  );
}
