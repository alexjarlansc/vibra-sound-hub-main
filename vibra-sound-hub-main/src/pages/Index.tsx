import React, { Suspense, lazy } from 'react';
import CtaSection from "@/components/CtaSection";
import SectionSkeleton from '@/components/fallbacks/SectionSkeleton';

// Lazy carregado para reduzir bundle inicial
const HeroSection = lazy(()=> import('@/components/HeroSection'));
const FeaturedSection = lazy(()=> import('@/components/FeaturedSection'));
// Essas seções hipotéticas podem ser pesadas; se não existirem, fallback (TrendingProfilesSection)
let TrendingProfilesSection: React.ComponentType | null = null;
try { TrendingProfilesSection = lazy(()=> import('@/components/TrendingProfilesSection')); } catch { /* ignore se não existir */ }

const Index = () => {
  return (
    <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
      {/* Padrão sutil extendido (opcional) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.25),transparent_60%)]" />
  <Suspense fallback={<SectionSkeleton height={420} />}> <HeroSection /> </Suspense>
  <div className="container mx-auto px-6 py-8 sm:py-10">
        <Suspense fallback={<SectionSkeleton height={380} />}> <FeaturedSection /> </Suspense>
        {TrendingProfilesSection && (
          <Suspense fallback={<SectionSkeleton height={300} />}> <TrendingProfilesSection /> </Suspense>
        )}
      </div>
      <CtaSection />
    </div>
  );
};

export default Index;
