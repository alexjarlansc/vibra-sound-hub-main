import React, { Suspense, lazy } from 'react';
import CtaSection from "@/components/CtaSection";
import SectionSkeleton from '@/components/fallbacks/SectionSkeleton';
import { Button } from '@/components/ui/button';
import { useTrendingProfiles, TrendingProfile } from '@/hooks/useTrendingProfiles';

// Tenta reusar seções já existentes (mais leves quando lazy)
const TrendingMusicsSection = lazy(()=> import('@/components/TrendingMusicsSection'));
let TrendingProfilesSection: React.ComponentType | null = null;
try { TrendingProfilesSection = lazy(()=> import('@/components/TrendingProfilesSection')); } catch { /* ignore se não existir */ }

// Fallback simples quando os componentes não existirem - mostramos markup estático similar ao screenshot
const MusicsListFallback: React.FC<{ onOpenTop100?: ()=>void }> = ({ onOpenTop100 })=> {
  const { data: artists = [], loading } = useTrendingProfiles({ limit: 5 });
  const topArtists: TrendingProfile[] = artists as TrendingProfile[];

  // Cria uma lista fallback de 20 músicas (duas colunas de 10)
  const baseTitles = [
    "Amor E Fé","Dois Amores, Duas Paixões","Coração De Aço","01 - Some Ou Fica",
    "Desbeijar Minha Boca","Beijo Com Trap","Alma de Pipa","Um Pedido",
    "A Rua (Pacificadores part. Hungria ...)","Choriada"
  ];
  const tracks: string[] = Array.from({ length: 20 }).map((_, i) => {
    const base = baseTitles[i % baseTitles.length];
    return i < baseTitles.length ? base : `${base} #${i+1}`;
  });

  const left = tracks.slice(0, 10);
  const right = tracks.slice(10, 20);

  return (
    <div className="bg-white/90 rounded-lg p-8 shadow-md border border-gray-100">
      <h3 className="text-4xl font-extrabold text-foreground mb-2">Top Músicas e Artistas</h3>
      <p className="text-sm text-muted-foreground mb-6">A semana está bombando com Hungria Hip Hop liderando</p>

      {/* Duas colunas com 10 músicas cada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ol className="space-y-4">
          {left.map((t,i)=> (
            <li key={`l-${i}`} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{t}</div>
                <div className="text-xs text-muted-foreground">Hungria Hip Hop · {(15000 - i*1000).toLocaleString()} plays</div>
              </div>
              <div className="ml-4 flex items-center">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-500 text-white font-semibold text-sm">{i+1}</div>
              </div>
            </li>
          ))}
        </ol>

        <ol className="space-y-4">
          {right.map((t,i)=> (
            <li key={`r-${i}`} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{t}</div>
                <div className="text-xs text-muted-foreground">Hungria Hip Hop · {(9000 - i*500).toLocaleString()} plays</div>
              </div>
              <div className="ml-4 flex items-center">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-500 text-white font-semibold text-sm">{10 + i+1}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Álbum em Alta - placeholder estático */}
      <div className="mt-8 bg-white rounded-md border p-4 flex items-center gap-4">
        <img src="/placeholder.svg" alt="Álbum em Alta" className="w-24 h-24 rounded-md object-cover" />
        <div className="flex-1">
          <div className="text-lg font-semibold">Álbum em Alta</div>
          <div className="text-sm text-muted-foreground">Nome do Álbum • Artista Exemplo</div>
          <div className="mt-3">
            <Button variant="default" onClick={()=> onOpenTop100 && onOpenTop100()} className="bg-emerald-500 hover:bg-emerald-600 text-white">OUVIR ÁLBUM</Button>
          </div>
        </div>
      </div>

      {/* Lista de artistas abaixo */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Artistas em alta</h4>
        <div className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando artistas...</div>
          ) : (
            topArtists.map((artist, i)=> (
              <div key={artist.id ?? `a-${i}`} className="flex items-center gap-3">
                <img src={artist.avatar_url ?? '/placeholder.svg'} alt={artist.username} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{artist.username}</div>
                  <div className="text-xs text-muted-foreground">{(artist.plays_count ?? 0).toLocaleString()} plays</div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-500 text-white font-semibold">{i+1}</div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button variant="default" onClick={()=> onOpenTop100 && onOpenTop100()} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white">OUVIR TOP MÚSICAS</Button>
        <Button variant="outline" className="w-full sm:w-auto border-gray-200">VER TOP ARTISTAS</Button>
      </div>
    </div>
  );
};

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
