import MusicCard from "./MusicCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTrendingAlbums } from "@/hooks/useTrendingAlbums";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// TODO: integrar com hook useTrendingAlbums (dados reais) quando view e tabelas existirem no banco
const FeaturedSection = () => {
  const [openAlbum, setOpenAlbum] = useState<{ id?:string; title:string; artist:string }|null>(null);
  const [openTrendingAll, setOpenTrendingAll] = useState(false);
  const { data: trendingData, loading: loadingTrending, reload } = useTrendingAlbums({ limit: 12 });
  const { userId } = useAuth();
  const { toast } = useToast();
  const featuredAlbums = [
    { title: "Cowboy Promocional 2025", artist: "Junior", colorVariant: 1 as const },
    { title: "Ao Vivo no Forró", artist: "Márcia Fellipe", colorVariant: 2 as const },
    { title: "Do Velho Testamento", artist: "Tierry", colorVariant: 3 as const },
    { title: "Agora Chegou a Hora", artist: "MC Hariel", colorVariant: 4 as const },
    { title: "Setembro", artist: "Zé Neto", colorVariant: 5 as const },
    { title: "Lembrar de Você", artist: "Gusttavo Lima", colorVariant: 6 as const },
    { title: "Estrelas Vivem", artist: "Luan Santana", colorVariant: 1 as const },
    { title: "Nova Músicas", artist: "Matheus & Kauan", colorVariant: 2 as const },
  ];

  const hotAlbums = [
    { title: "Viva a Bagaceira", artist: "Wesley Safadão", colorVariant: 3 as const },
    { title: "Cicatrizes", artist: "Wesley Safadão", colorVariant: 4 as const },
    { title: "Gente Quieta", artist: "TBT Ws", colorVariant: 5 as const },
    { title: "Delta G", artist: "TBT Ws", colorVariant: 6 as const },
    { title: "Nem As", artist: "Wesley Safadão", colorVariant: 1 as const },
    { title: "Estrelas Vivem", artist: "TBT Ws", colorVariant: 2 as const },
  ];

  const tendencias100 = useMemo(()=>{
    const base = [...featuredAlbums];
    // gerar lista até 100 itens repetindo base
    const list: { title:string; artist:string; colorVariant: any }[] = [];
    let i=0; while(list.length < 100){
      const b = base[i % base.length];
      list.push({ ...b, title: b.title + (list.length>=base.length?` #${list.length+1}`:"") });
      i++;
    }
    return list;
  },[featuredAlbums]);

  const fakeTracks = (albumTitle:string) => Array.from({length:8},(_,i)=>({
    id: i+1,
    name: `Faixa ${i+1} - ${albumTitle.split(' ')[0]}`,
    duration: `${3+i%2}:${(10+i*7)%60}`.padStart(4,'0')
  }));

  const handleLike = useCallback(async (albumId?:string)=>{
    if(!albumId){ return; }
    if(!userId){ toast({ title: 'Faça login para curtir.' }); return; }
    const { error } = await (supabase as any).rpc('toggle_album_like', { p_album: albumId });
    if(error){ toast({ title: 'Erro curtida', description: error.message, variant: 'destructive'}); return; }
    reload();
  },[userId, toast, reload]);

  const handleDownload = useCallback(async (albumId?:string)=>{
    if(!albumId) return;
    const { error } = await (supabase as any).rpc('register_album_download', { p_album: albumId });
    if(error){ toast({ title: 'Erro download', description: error.message, variant: 'destructive'}); return; }
    reload();
  },[reload, toast]);

  const handlePlay = useCallback(async (albumId?:string)=>{
    // sem trackId real aqui; somente feedback visual
    toast({ title: 'Play simulado (integre player real depois).' });
  },[toast]);

  return (
    <div className="space-y-16">
      {/* Trending Section */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Trending Agora</h2>
          </div>
          <Button onClick={()=> setOpenTrendingAll(true)} variant="ghost" className="text-primary hover:bg-primary/5">
            Ver Todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {(trendingData.length ? trendingData : featuredAlbums.slice(0,6)).map((album: any, index:number) => (
            <MusicCard
              key={album.id || index}
              id={album.id}
              title={album.name || album.title}
              artist={album.artist || 'Artista'}
              colorVariant={(album.colorVariant || ((index%6)+1)) as any}
              size="medium"
              onClick={()=> setOpenAlbum({ id: album.id, title: album.name || album.title, artist: album.artist || 'Artista' })}
              onLike={()=> handleLike(album.id)}
              onDownload={()=> handleDownload(album.id)}
              onPlay={()=> handlePlay(album.id)}
              likeCount={album.likes_count}
            />
          ))}
        </div>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {hotAlbums.map((album, index) => (
            <MusicCard
              key={index}
              title={album.title}
              artist={album.artist}
              colorVariant={album.colorVariant}
              size="medium"
        onClick={()=> setOpenAlbum({ title: album.title, artist: album.artist })}
            />
          ))}
        </div>
      </div>

      {/* Call to Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-orange-500/80 to-red-500/80 text-white backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">🔔 Fique por Dentro!</h3>
            <p className="text-lg opacity-90 mb-4">Seja notificado sobre os últimos lançamentos</p>
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              Inscrever-se
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-500/80 to-blue-600/80 text-white backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">📱 App Mobile</h3>
            <p className="text-lg opacity-90 mb-4">Leve sua música para qualquer lugar</p>
            <div className="flex justify-center space-x-4">
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                iOS
              </Button>
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                Android
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
              {tendencias100.map((a,i)=>(
                <MusicCard
                  key={i}
                  title={a.title}
                  artist={a.artist}
                  colorVariant={a.colorVariant}
                  size="small"
                  onClick={()=> { setOpenTrendingAll(false); setOpenAlbum({ title:a.title, artist:a.artist }); }}
                  disableActions
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturedSection;