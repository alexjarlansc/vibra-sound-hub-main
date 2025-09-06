import { Play, Pause, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// using plain div instead of Badge component to avoid typing conflict here
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlayer } from '@/context/PlayerContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePlaylists } from '@/hooks/usePlaylists';

const HeroSection = () => {
  const { play, toggle, current, playing, playQueue } = usePlayer();
  // Identificador da faixa demo da Home
  // não usamos mais demo audio
  const { create: createPlaylist } = usePlaylists();
  const { toast } = useToast();
  const handleHeroPlay = async () => {
    if(!featuredAlbum?.id){ toast({ title: 'Nenhum álbum em destaque', description: 'Nenhum álbum disponível para tocar.' }); return; }
    setLoadingTracks(true);
    try{
      const { data: tracks } = await supabase.from('tracks').select('id, filename, file_url, album_id').eq('album_id', featuredAlbum.id).order('created_at',{ ascending: true }) as any;
      const list = tracks || [];
      if(!list.length){ toast({ title: 'Álbum sem faixas', description: 'O álbum em destaque não possui faixas.' }); return; }
      const toPlay = list.map((t:any)=> ({ id: t.id, title: t.filename?.replace(/\.[a-zA-Z0-9]+$/,''), url: t.file_url, albumId: t.album_id }));
      playQueue(toPlay, 0);
    }catch(e:any){ toast({ title: 'Erro ao tocar álbum', description: e?.message || String(e), variant: 'destructive' }); }
    finally { setLoadingTracks(false); }
  };
  const { userId } = useAuth();
  // Album em destaque (dinâmico) — prioriza destaque do usuário logado
  const [featuredAlbum, setFeaturedAlbum] = useState<{ id: string; name: string; cover_url?: string | null } | null>(null);

  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      try{
        let fid: string | null = null;
        if(userId){
          const { data: p, error: perr } = await supabase.from('profiles').select('featured_album_id').eq('id', userId).maybeSingle() as any;
          if(!perr && p?.featured_album_id) fid = p.featured_album_id;
        }
        // fallback global se nenhum do usuário
        if(!fid){
          const { data: profiles } = await supabase.from('profiles').select('featured_album_id').not('featured_album_id','is',null).order('updated_at',{ ascending: false }).limit(1) as any;
          fid = profiles && profiles.length ? profiles[0]?.featured_album_id : null;
        }
  if(!fid){ if(mounted) setFeaturedAlbum(null); return; }
  const { data: album } = await supabase.from('albums').select('id, name, cover_url').eq('id', fid).single() as any;
  // mesmo que album seja null, definimos featuredAlbum com id para exibir um fallback
  if(mounted) setFeaturedAlbum(album || { id: fid, name: null, cover_url: null });
      }catch(e){ if(mounted) setFeaturedAlbum(null); }
    };
    load();
    const onUpdated = ()=> load();
    window.addEventListener('profile:updated', onUpdated as EventListener);
    return ()=>{ mounted = false; window.removeEventListener('profile:updated', onUpdated as EventListener); };
  },[userId]);
  const [openFeaturedDialog, setOpenFeaturedDialog] = useState(false);

  const openFeaturedAlbumDialog = async () => {
    if(!featuredAlbum?.id) return;
    // baixa faixas no background (reaproveita lógica do FeaturedSection)
    // carrega faixas e abre
    setLoadingTracks(true);
    try{
      const { data: tracks } = await supabase.from('tracks').select('id, filename, file_url, album_id').eq('album_id', featuredAlbum.id).order('created_at',{ ascending: true }) as any;
      setFeaturedTracks(tracks || []);
    }catch(e){ setFeaturedTracks([]); }
    setLoadingTracks(false);
    setOpenFeaturedDialog(true);
  };

  const [featuredTracks, setFeaturedTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  return (
    <div className="relative min-h-[52vh] flex items-center justify-center overflow-hidden pt-2">
      {/* Background overlay suavizado (mais leve para combinar com gradiente global) */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/10 to-transparent"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <div className="container mx-auto px-6 relative z-10">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mb-4 bg-primary/10 text-primary border-primary/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending Now
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent leading-tight">
              Descubra
              <br />
              Nomix
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              Explore milhões de faixas, descubra novos artistas e crie suas playlists personalizadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={handleHeroPlay}
                className="bg-gradient-primary hover:opacity-90 h-12 px-8 rounded-full flex items-center"
                aria-label={playing ? 'Pausar' : 'Tocar'}
              >
                {playing ? (
                  <Pause className="w-5 h-5 mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2 fill-current" />
                )}
                {playing ? 'Pausar' : 'Começar a Ouvir'}
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-primary/20 hover:bg-primary/5" onClick={async ()=>{
                const name = window.prompt('Nome da nova playlist:');
                if(!name) return;
                try{ await createPlaylist({ name }); alert('Playlist criada.'); }catch(e:any){ alert('Erro ao criar playlist: '+(e?.message||String(e))); }
              }}>
                <Plus className="w-5 h-5 mr-2" />
                Criar Playlist
              </Button>
            </div>
          </div>

          {/* Featured Album Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-80 h-80 relative overflow-hidden group cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20">
              <CardContent className="p-0 h-full">
                <div className="h-full flex flex-col justify-between p-0 text-white">
                  {/* Capa */}
                  <div className="h-1/2 w-full">
                    {featuredAlbum?.cover_url ? (
                      <img src={featuredAlbum.cover_url} alt={featuredAlbum?.name || 'Álbum destaque'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-music-card-1 to-music-card-4 p-8">
                        <div className="h-full flex flex-col justify-between p-8 text-white">
                          <div>
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-4 bg-white/20 text-white border-white/30">Album em Destaque</div>
                            <h3 className="text-2xl font-bold mb-2">{featuredAlbum?.name ?? 'Título do Álbum'}</h3>
                            <h4 className="text-xl font-medium mb-1">{featuredAlbum ? 'Álbum em destaque' : 'Subtítulo / Ano'}</h4>
                            <p className="text-lg opacity-90">Artista</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gradient-to-br from-music-card-1 to-music-card-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{featuredAlbum?.name ?? 'Título do Álbum'}</h3>
                      <p className="text-sm opacity-80">Artista</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={()=> openFeaturedAlbumDialog()}>Abrir</Button>
                      <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full w-12 h-12 p-0" onClick={async ()=>{
                        if(!featuredAlbum?.id) return; try{
                          const { data: tracks } = await supabase.from('tracks').select('id, filename, file_url, album_id').eq('album_id', featuredAlbum.id).order('created_at',{ ascending: true }) as any;
                          if(!tracks || !tracks.length){ return; }
                          const toPlay = (tracks as any[]).map((t:any)=> ({ id: t.id, title: t.filename.replace(/\.[a-zA-Z0-9]+$/,''), url: t.file_url, albumId: t.album_id }));
                          playQueue(toPlay, 0);
                        }catch(e){ /* ignore */ }
                      }}>
                        <Play className="w-5 h-5 fill-current" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  {/* Volume removido */}
    {/* Dialog de faixas do álbum em destaque */}
    <Dialog open={openFeaturedDialog} onOpenChange={(o)=>{ if(!o) setOpenFeaturedDialog(false); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{featuredAlbum?.name ?? 'Álbum em destaque'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loadingTracks ? <div>Carregando faixas...</div> : (
            <ScrollArea className="h-60">
              <ul className="space-y-2 p-2">
                {featuredTracks.map((t,i)=> (
                  <li key={t.id} className="flex items-center justify-between">
                    <div className="text-sm">{i+1}. {t.filename?.replace(/\.[a-zA-Z0-9]+$/,'')}</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={()=>{ playQueue([{ id: t.id, title: t.filename?.replace(/\.[a-zA-Z0-9]+$/,''), url: t.file_url, albumId: t.album_id }], 0); setOpenFeaturedDialog(false); }}>Tocar</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=> setOpenFeaturedDialog(false)}>Fechar</Button>
            <Button onClick={()=>{ if(featuredTracks.length){ playQueue(featuredTracks.map((t:any)=> ({ id: t.id, title: t.filename?.replace(/\.[a-zA-Z0-9]+$/,''), url: t.file_url, albumId: t.album_id })), 0); setOpenFeaturedDialog(false); } }}>Tocar álbum</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
};

export default HeroSection;