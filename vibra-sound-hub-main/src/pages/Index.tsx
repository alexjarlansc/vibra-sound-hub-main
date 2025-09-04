import HeroSection from "@/components/HeroSection";
import FeaturedSection from "@/components/FeaturedSection";
import TrendingProfilesSection from "@/components/TrendingProfilesSection";
import CtaSection from "@/components/CtaSection";

const Index = () => {
  return (
    <div>
      <HeroSection />
      <div className="container mx-auto px-6 py-16">
        <FeaturedSection />
        <TrendingProfilesSection />
      </div>
      <CtaSection />
    </div>
  );
};

export default Index;
