import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import NowInGangnam from "@/components/sections/NowInGangnam";
import HotPlaces from "@/components/sections/HotPlaces";
import ThemeTravel from "@/components/sections/ThemeTravel";
import InfluencerPicks from "@/components/sections/InfluencerPicks";
import Events from "@/components/sections/Events";
import Gallery from "@/components/sections/Gallery";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <NowInGangnam />
        <HotPlaces />
        <ThemeTravel />
        <InfluencerPicks />
        <Events />
        <Gallery />
      </main>
      <Footer />
    </>
  );
}
