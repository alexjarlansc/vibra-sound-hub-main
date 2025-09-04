import { useTrendingTracks } from '@/hooks/useTrendingTracks';
import MusicCard from '@/components/MusicCard';
import PageShell from '@/components/PageShell';

const TopMusics = () => {
  const { data: trendingTracks } = useTrendingTracks({ limit: 100 });

  // fallback simples caso não haja dados
  const fallback = Array.from({ length: 100 }, (_, i) => ({
    id: `fake-${i}`,
    name: `Música #${i + 1}`,
    artist: 'Artista'
  }));
  const list = (trendingTracks.length ? trendingTracks : fallback).slice(0, 100) as { id:string; name:string; artist:string }[];

  return (
    <PageShell title="Top 100 Músicas" subtitle="Ranking baseado em plays (1x), likes (3x) e downloads (2x).">
      <div className="panel p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {list.map((item, i) => (
            <MusicCard
              key={item.id || i}
              id={item.id}
              title={item.name}
              artist={item.artist}
              colorVariant={((i % 6) + 1) as 1|2|3|4|5|6}
              size="small"
              disableActions
            />
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default TopMusics;
