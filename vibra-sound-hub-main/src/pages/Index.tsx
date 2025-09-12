import React, { Suspense, lazy } from 'react';
import CtaSection from "@/components/CtaSection";
import SectionSkeleton from '@/components/fallbacks/SectionSkeleton';

// Tenta reusar a seção de músicas (lazy)
const TrendingMusicsSection = lazy(()=> import('@/components/TrendingMusicsSection'));

const Index = () => {
  const [openTop100, setOpenTop100] = React.useState(false);
  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-transparent to-accent/5 min-h-screen pb-12">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.25),transparent_60%)]" />

      <div className="container mx-auto px-6 py-12">
        {/* Tenta usar a seção real se existir, caso contrário usa fallback estático */}
        <Suspense fallback={<SectionSkeleton height={520} />}>
          {/* Se houver uma implementação mais rica de TrendingMusicsSection, use-a (controlável) */}
          <TrendingMusicsSection externalOpen={openTop100} onExternalOpenChange={setOpenTop100} />
        </Suspense>

        {/* Também tentamos carregar a seção de perfis; se falhar, mostramos apenas a lista acima */}
        {TrendingProfilesSection && (
          <div className="mt-8">
            <Suspense fallback={<SectionSkeleton height={260} />}>
              <TrendingProfilesSection />
            </Suspense>
          </div>
        )}

        {/* Se o componente TrendingMusicsSection não estiver presente no bundle, mostramos fallback manual */}
        <div className="mt-8 sm:mt-12">
          <MusicsListFallback onOpenTop100={()=> setOpenTop100(true)} />
        </div>
      </div>

      <CtaSection />
    </div>
  );
};

export default Index;
