import { useState, useMemo } from 'react';
import MusicCard from '@/components/MusicCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Music2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTrendingMusics } from '@/hooks/useTrendingMusics';

/* Componente para Músicas em Alta (Trending) */
const TrendingMusicsSection = () => {
  const [openAll, setOpenAll] = useState(false);
  const { data, loading } = useTrendingMusics({ limit: 12 });

  // fallback fake data caso view não exista ainda
  interface FallbackTrack { title: string; artist: string; }
  const fallback = useMemo<FallbackTrack[]>(()=>{
    const base: FallbackTrack[] = [
      { title: 'Festa no Sertão', artist: 'Artista 1' },
      { title: 'Coração Acelerado', artist: 'Artista 2' },
      { title: 'Noite Estrelada', artist: 'Artista 3' },
      { title: 'Vento do Norte', artist: 'Artista 4' },
      { title: 'Chuva de Verão', artist: 'Artista 5' },
      { title: 'Luz da Manhã', artist: 'Artista 6' },
    ];
    const list: FallbackTrack[] = [];
    let i=0; while(list.length < 100){
      const b = base[i % base.length];
      list.push({ ...b, title: b.title + (list.length>=base.length?` #${list.length+1}`:'') });
      i++;
    }
    return list;
  },[]);

  type TopItem = { id?: string; title: string; artist: string; colorVariant: 1|2|3|4|5|6 };
  const top12: TopItem[] = (data.length? data.map<TopItem>((t,i)=>({
    id: t.id,
    title: t.name,
    artist: 'Artista', // placeholder até ter relação artista
    colorVariant: ((i%6)+1) as 1|2|3|4|5|6
  })) : fallback.slice(0,12).map<TopItem>((f,i)=>({ ...f, colorVariant: ((i%6)+1) as 1|2|3|4|5|6 })));

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Music2 className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Músicas em Alta</h2>
        </div>
        <Button onClick={()=> setOpenAll(true)} variant="ghost" className="text-primary hover:bg-primary/5">
          Ver Todos
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {top12.map((track, index)=>(
          <MusicCard
            key={track.id || index}
            id={track.id}
            title={track.title}
            artist={track.artist}
            colorVariant={track.colorVariant}
            size="medium"
            disableActions
          />
        ))}
      </div>

      <Dialog open={openAll} onOpenChange={setOpenAll}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Top 100 Músicas</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(() => {
                type Item = { id?: string; title: string; artist: string; colorVariant: 1|2|3|4|5|6 };
                const full: Item[] = data.length
                  ? (top12 as Item[]).concat(
                      fallback.slice(top12.length, 100).map<Item>((f,i2)=>({
                        ...f,
                        colorVariant: ((i2%6)+1) as 1|2|3|4|5|6
                      }))
                    )
                  : fallback.map<Item>((f,i2)=>({ ...f, colorVariant: ((i2%6)+1) as 1|2|3|4|5|6 }));
                return full.slice(0,100).map((t,i)=>(
                  <MusicCard
                    key={t.id ?? i}
                    title={t.title}
                    artist={t.artist}
                    colorVariant={t.colorVariant}
                    size="small"
                    disableActions
                  />
                ));
              })()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrendingMusicsSection;
