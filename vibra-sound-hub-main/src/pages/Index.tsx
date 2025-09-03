import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturedSection from "@/components/FeaturedSection";
import MusicPlayer from "@/components/MusicPlayer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="pb-28">
        <HeroSection />
        <div className="container mx-auto px-6 py-16">
          <FeaturedSection />
        </div>
      </main>
      
      <MusicPlayer />
    </div>
  );
};

export default Index;
