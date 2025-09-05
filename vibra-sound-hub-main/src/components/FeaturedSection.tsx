import MusicCard from "./MusicCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { usePlayer } from '@/context/PlayerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTrendingAlbums } from "@/hooks/useTrendingAlbums";
import { useTrendingTracks } from "@/hooks/useTrendingTracks";
import { useFavoriteAlbums } from "@/hooks/useFavorites";
import { useTrackFavorites } from "@/hooks/useTrackFavorites";
import { useRegisterPlay } from "@/hooks/useRegisterPlay";
import { enqueueMetric } from "@/lib/metricsQueue";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { downloadAlbumAsZip } from '@/lib/downloadAlbumZip';

// TODO: integrar com hook useTrendingAlbums (dados reais) quando view e tabelas existirem no banco
const FeaturedSection = () => {
  const [openAlbum, setOpenAlbum] = useState<{ id?:string; title:string; artist:string }|null>(null);
  const [openTrendingAll, setOpenTrendingAll] = useState(false);
  const { data: trendingData, loading: loadingTrending, reload } = useTrendingAlbums({ limit: 12 });
  const { data: trendingTracks, loading: loadingTracks } = useTrendingTracks({ limit: 12 });
  const { isLiked: isAlbumLiked, toggleLike: toggleAlbumLike } = useFavoriteAlbums();
  const { isLiked: isTrackLiked, toggleTrackLike } = useTrackFavorites();
  const { userId } = useAuth();
  const { toast } = useToast();
  type ColorVariant = 1|2|3|4|5|6;
  interface FeaturedItem { id?: string; title:string; artist:string; colorVariant: ColorVariant; }
  // Dados mock removidos: agora listas vazias até integrar fonte real.
  const featuredAlbums: FeaturedItem[] = useMemo(() => ([]), []);
  const hotAlbums = useMemo(()=> (trendingData||[]).slice(0,6).map((a,i)=> ({
    id: a.id,
    title: a.name?.replace(/\.[a-zA-Z0-9]+$/, '') || 'Álbum',
    artist: 'Artista',
    cover: a.cover_url || undefined,
    colorVariant: ((i%6)+1) as ColorVariant
  })), [trendingData]);

  const tendencias100: FeaturedItem[] = useMemo(()=>[],[]);

  const fakeTracks = (albumTitle:string) => Array.from({length:8},(_,i)=>({
    id: i+1,
    name: `Faixa ${i+1} - ${albumTitle.split(' ')[0]}`,
    duration: `${3+i%2}:${(10+i*7)%60}`.padStart(4,'0')
  }));

  const safeRpc = async <T=unknown>(fn: string, params: Record<string, unknown>) => {
    const client = supabase as unknown as { rpc: (f:string, p:Record<string,unknown>)=>Promise<{ data:T|null; error:{ message:string }|null }> };
    const { error } = await client.rpc(fn, params);
    return error;
  };

  const trackIdSet = useMemo(()=> new Set((trendingTracks||[]).map(t=> t.id).filter(Boolean)), [trendingTracks]);

  const handleLike = useCallback(async (id?:string)=>{
    if(!id) return;
    if(!userId){ toast({ title: 'Faça login para curtir.' }); return; }
    // Decide se é track ou álbum pelo que temos carregado
    if(trackIdSet.has(id)) {
      toggleTrackLike(id);
    } else {
      toggleAlbumLike(id);
    }
  },[userId, toast, trackIdSet, toggleTrackLike, toggleAlbumLike]);

  const handleDownload = useCallback(async (id?:string)=>{
    if(!id) return;
    if(trackIdSet.has(id)){
      enqueueMetric({ type: 'track_download', id, ts: Date.now() });
      toast({ title: 'Download de faixa registrado.' });
      reload();
      return;
    }
    toast({ title: 'Preparando ZIP do álbum...' });
    try {
      await downloadAlbumAsZip(id, { onProgress:(p)=>{ if(p===100) toast({ title:'ZIP pronto, iniciando download.' }); } });
    } catch(e:any){
      toast({ title: 'Falha ao gerar ZIP', description: e.message||String(e), variant:'destructive' });
      return;
    }
    reload();
  },[reload, toast, trackIdSet]);

  const { play } = usePlayer();
  const { registerTrackPlay } = useRegisterPlay();
  const handlePlay = useCallback(async (id?:string)=>{
    if(!id){ toast({ title: 'Sem ID para tocar.' }); return; }
    // Decide se é track ou álbum; se track registra play
    if(trackIdSet.has(id)) {
      registerTrackPlay(id);
    }
    // Placeholder player real
    toast({ title: 'Reprodução iniciada (demo)' });
  },[toast, trackIdSet, registerTrackPlay]);

  interface TrackLike { id?: string; name?: string; title?: string; artist?: string; likes_count?: number; }

  const displayedMusicItems: TrackLike[] = useMemo(()=>{
    const primary: TrackLike[] = (trendingTracks.length
      ? trendingTracks
      : (trendingData.length ? trendingData : [])) as TrackLike[];
    return primary.slice(0,12);
  },[trendingTracks, trendingData]);

  return (
    <div className="space-y-16">
      {/* Trending Section */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Músicas em Alta</h2>
          </div>
          <Button onClick={()=> setOpenTrendingAll(true)} variant="ghost" className="text-primary hover:bg-primary/5">
            Top 100
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {displayedMusicItems.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground border rounded-lg bg-background/40">
            Nenhuma música em alta no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {displayedMusicItems.map((item, index) => {
                const rawTitle = item.name || item.title || '—';
                const title = rawTitle.replace(/\.[a-zA-Z0-9]+$/, '');
                const colorVariant = ((index%6)+1) as ColorVariant;
                return (
                  <MusicCard
                    key={item.id || index}
                    id={item.id}
                    title={title}
                    artist={item.artist || 'Artista'}
                    colorVariant={colorVariant}
                    size="medium"
                    onClick={()=> setOpenAlbum({ id: item.id, title, artist: item.artist || 'Artista' })}
                    liked={isTrackLiked(item.id) || isAlbumLiked(item.id)}
                    onLike={()=> handleLike(item.id)}
                    onDownload={()=> handleDownload(item.id)}
                    onPlay={()=> handlePlay(item.id)}
                    likeCount={item.likes_count}
                    downloadsCount={(item as any).downloads_count}
                    playsCount={(item as any).plays_count}
                  />
                );
              })}
          </div>
        )}
      </div>

      {/* Hot Albums */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Álbuns em Alta</h2>
      <Button onClick={()=> setOpenTrendingAll(true)} variant="ghost" className="text-primary hover:bg-primary/5">
            Ver Todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {hotAlbums.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground border rounded-lg bg-background/40">
            Nenhum álbum em alta no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {hotAlbums.map((album, index) => (
              <MusicCard
                key={index}
        id={album.id}
                title={album.title}
                artist={album.artist}
        image={album.cover}
                colorVariant={album.colorVariant}
                size="medium"
                onClick={()=> setOpenAlbum({ title: album.title, artist: album.artist })}
              />
            ))}
          </div>
        )}
      </div>

  {/* CTA removido: agora em CtaSection no final da página */}
      {/* Dialog álbum individual */}
      <Dialog open={!!openAlbum} onOpenChange={(o)=> !o && setOpenAlbum(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{openAlbum?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Artista: {openAlbum?.artist}</p>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 w-12">#</th>
                    <th className="text-left px-3 py-2">Faixa</th>
                    <th className="text-right px-3 py-2 w-16">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {openAlbum && fakeTracks(openAlbum.title).map(t => (
                    <tr key={t.id} className="border-t hover:bg-muted/40">
                      <td className="px-3 py-2 text-xs text-muted-foreground">{t.id}</td>
                      <td className="px-3 py-2">{t.name}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">{t.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog 100 tendências */}
      <Dialog open={openTrendingAll} onOpenChange={setOpenTrendingAll}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Top 100 Tendências</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tendencias100.length === 0 ? (
                <div className="col-span-full text-center text-sm text-muted-foreground py-8">
                  Nenhum item para exibir.
                </div>
              ) : (
                tendencias100.map((a,i)=>(
                  <MusicCard
                    key={i}
                    title={a.title}
                    artist={a.artist}
                    colorVariant={a.colorVariant}
                    size="small"
                    onClick={()=> { setOpenTrendingAll(false); setOpenAlbum({ title:a.title, artist:a.artist }); }}
                    disableActions
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturedSection;