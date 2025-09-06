import MusicCard from "./MusicCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Play, Heart, Download, Plus } from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { usePlayer } from '@/context/PlayerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTrendingAlbums } from "@/hooks/useTrendingAlbums";
import { useTrendingTracks } from "@/hooks/useTrendingTracks";
import { useFavoriteAlbums } from "@/hooks/useFavorites";
import { useTrackFavorites } from "@/hooks/useTrackFavorites";
import { useRegisterPlay } from "@/hooks/useRegisterPlay";
import { usePlaylists } from '@/hooks/usePlaylists';
import { enqueueMetric } from "@/lib/metricsQueue";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { downloadAlbumAsZip } from '@/lib/downloadAlbumZip';

// TODO: integrar com hook useTrendingAlbums (dados reais) quando view e tabelas existirem no banco
const FeaturedSection = () => {
  const [openAlbum, setOpenAlbum] = useState<{ id?:string; title:string; artist:string }|null>(null);
  const [openTrendingAll, setOpenTrendingAll] = useState(false);
  const [openTrendingAlbums, setOpenTrendingAlbums] = useState(false);
  const { data: trendingData, loading: loadingTrending, reload } = useTrendingAlbums({ limit: 12 });
  const { data: trendingTracks, loading: loadingTracks } = useTrendingTracks({ limit: 12 });
  const { isLiked: isAlbumLiked, toggleLike: toggleAlbumLike } = useFavoriteAlbums();
  const { isLiked: isTrackLiked, toggleTrackLike, counts: trackLikeCounts } = useTrackFavorites();
  const { userId } = useAuth();
  const { toast } = useToast();
  type ColorVariant = 1|2|3|4|5|6;
  interface FeaturedItem { id?: string; albumId?: string; title:string; artist:string; colorVariant: ColorVariant; cover?: string; }
  // Dados mock removidos: agora listas vazias até integrar fonte real.
  const featuredAlbums: FeaturedItem[] = useMemo(() => ([]), []);
  const hotAlbums = useMemo(()=> (trendingData||[]).slice(0,6).map((a,i)=> ({
    id: a.id,
    title: a.name?.replace(/\.[a-zA-Z0-9]+$/, '') || 'Álbum',
    artist: 'Artista',
    cover: a.cover_url || undefined,
    colorVariant: ((i%6)+1) as ColorVariant
  })), [trendingData]);

  // Top 100 músicas em alta (dados reais)
  const top100Tracks: FeaturedItem[] = useMemo(() => (
    (trendingTracks && trendingTracks.length)
      ? trendingTracks.slice(0, 100).map((t, i) => ({
          id: t.id,
          albumId: (t as any).album_id || undefined,
          title: t.name?.replace(/\.[a-zA-Z0-9]+$/, '') || 'Música',
          artist: 'Artista',
          colorVariant: ((i % 6) + 1) as ColorVariant
        }))
      : []
  ), [trendingTracks]);

  // Top 100 álbuns em alta (dados reais)
  const top100Albums: FeaturedItem[] = useMemo(() => (
    (trendingData && trendingData.length)
      ? trendingData.slice(0, 100).map((a, i) => ({
          id: a.id,
          title: a.name?.replace(/\.[a-zA-Z0-9]+$/, '') || 'Álbum',
          artist: 'Artista',
          colorVariant: ((i % 6) + 1) as ColorVariant,
          cover: a.cover_url || undefined
        }))
      : []
  ), [trendingData]);

  const fakeTracks = (albumTitle:string) => Array.from({length:8},(_,i)=>({
    id: i+1,
    name: `Faixa ${i+1} - ${albumTitle.split(' ')[0]}`,
    duration: `${3+i%2}:${(10+i*7)%60}`.padStart(4,'0')
  }));

  // Album details quando um álbum é selecionado
  const [albumDetails, setAlbumDetails] = useState<null | { cover_url?: string | null; description?: string | null; tracks?: Array<{ id: string; filename: string; duration?: string | null; file_url?: string | null }> }>(null);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [albumDebug, setAlbumDebug] = useState<any>(null);
  // playlist UI
  const { data: playlists, loading: loadingPlaylists, reload: reloadPlaylists } = usePlaylists();
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [trackToAdd, setTrackToAdd] = useState<string | null>(null);

  const openAddToPlaylist = useCallback((trackId?:string)=>{
    if(!trackId) return;
    if(!userId){ toast({ title: 'Faça login para adicionar a uma playlist.' }); return; }
    setTrackToAdd(trackId);
    setShowAddPlaylist(true);
  },[userId, toast]);

  const handleAddToPlaylist = useCallback(async ()=>{
    if(!trackToAdd) return;
    if(!selectedPlaylist){ toast({ title:'Selecione uma playlist.' }); return; }
    setAddingToPlaylist(true);
    try{
  const { error } = await (supabase.from('playlist_tracks') as any).insert({ playlist_id: selectedPlaylist, track_id: trackToAdd } as any);
      if(error) throw error;
      toast({ title: 'Faixa adicionada à playlist.' });
      setShowAddPlaylist(false);
      setSelectedPlaylist('');
      setTrackToAdd(null);
      reloadPlaylists();
    }catch(e:any){ toast({ title:'Falha ao adicionar à playlist', description: e?.message||String(e), variant:'destructive' }); }
    finally { setAddingToPlaylist(false); }
  },[selectedPlaylist, trackToAdd, reloadPlaylists, toast]);

  useEffect(()=>{
    let active = true;
    if(!openAlbum?.id){ setAlbumDetails(null); return; }
    (async ()=>{
      setLoadingAlbum(true);
      console.debug('[FeaturedSection] abrir album', { openAlbum });
      try{
        // Tenta carregar álbum pelo id fornecido
  const { data: alb, error: albErr } = await supabase.from('albums').select('id, name, cover_url').eq('id', String(openAlbum.id)).single() as any;
  console.debug('[FeaturedSection] albums.query result', { alb, albErr });
  if(albErr && !active){ console.warn('[FeaturedSection] falha ao buscar album', albErr); setAlbumDetails(null); return; }

        // Busca faixas usando album_id = openAlbum.id
  let { data: tracks, error: tracksErr } = await supabase.from('tracks').select('id, filename, file_url, album_id').eq('album_id', String(openAlbum.id)).order('created_at', { ascending: true }) as any;
  console.debug('[FeaturedSection] tracks.query result', { tracks, tracksErr });
  setAlbumDebug({ step: 'initial', alb, albErr, tracks, tracksErr });

        // Se não encontrar faixas, pode ser que o usuário tenha clicado numa FAIXA (openAlbum.id é track.id).
        // Nesse caso, buscamos a track por id e usamos seu album_id (se existir) para recarregar os dados do álbum.
        if((!tracks || tracks.length === 0) && (!tracksErr)){
          const { data: singleTrack, error: singleTrackErr } = await supabase.from('tracks').select('id, filename, file_url, album_id').eq('id', String(openAlbum.id)).single() as any;
          console.debug('[FeaturedSection] singleTrack query', { singleTrack, singleTrackErr });
          setAlbumDebug(prev=> ({ ...prev, step: 'singleTrack', singleTrack, singleTrackErr }));
          if(singleTrack && (singleTrack as any).album_id){
            // recarrega álbum pelos dados do album_id
            const albumId = String((singleTrack as any).album_id);
            const { data: alb2, error: alb2Err } = await supabase.from('albums').select('id, name, cover_url').eq('id', albumId).single() as any;
            console.debug('[FeaturedSection] alb2 query', { alb2, alb2Err });
            setAlbumDebug(prev=> ({ ...prev, step: 'albByTrack', alb2, alb2Err }));
            if(alb2 && !alb2Err){
              const { data: tracks2 } = await supabase.from('tracks').select('id, filename, file_url').eq('album_id', albumId).order('created_at', { ascending: true }) as any;
              const a = alb2 as any;
              setAlbumDetails({ cover_url: a.cover_url || null, description: a.description || null, tracks: tracks2 || [] });
              return;
            }
          }
          // Fallback: tentar achar álbum pelo título (caso id não seja o id do álbum)
          if(openAlbum?.title){
            const { data: albumsByName } = await supabase.from('albums').select('id, name, cover_url').ilike('name', `%${openAlbum.title}%`).limit(1) as any;
            console.debug('[FeaturedSection] albumsByName', { albumsByName });
            if(albumsByName && albumsByName.length){
              const albFound = albumsByName[0];
              const { data: tracksByAlb, error: tracksByAlbErr } = await supabase.from('tracks').select('id, filename, duration, file_url').eq('album_id', albFound.id).order('created_at', { ascending: true }) as any;
              setAlbumDebug(prev=> ({ ...prev, step: 'albumsByName', albumsByName, tracksByAlb, tracksByAlbErr }));
              setAlbumDetails({ cover_url: albFound.cover_url || null, description: albFound.description || null, tracks: tracksByAlb || [] });
              return;
            }
          }
        }

        // Caso padrão: usa o álbum original (se encontrado) e as faixas retornadas (ou vazio)
        let a = (alb || null) as any;
        let finalTracks = tracks || [];

        // Se não vier cover, tente puxar de trendingData (exibido nos cards)
        if((!a || !a.cover_url) && openAlbum?.id){
          try{
            const found = (trendingData||[]).find((x:any)=> String(x.id) === String(openAlbum.id));
            if(found){ a = { ...a, cover_url: found.cover_url || null, description: a?.description || null }; }
          }catch(e){ /* ignore */ }
        }

        // Se não houver faixas, tente buscar por nome de arquivo/album como fallback
        if((!finalTracks || finalTracks.length === 0) && openAlbum?.title){
          try{
            const { data: byName } = await supabase.from('tracks').select('id, filename, duration, file_url, album_id').ilike('filename', `%${openAlbum.title}%`).order('created_at', { ascending: true }) as any;
            if(byName && byName.length){
              finalTracks = byName;
            }
          }catch(e){ /* ignore */ }
        }

  setAlbumDetails({ cover_url: a?.cover_url || null, description: a?.description || null, tracks: finalTracks || [] });
  setAlbumDebug(prev=> ({ ...prev, step: 'final', alb: a, finalTracks }));
      }catch(e){
        if(active) setAlbumDetails(null);
      } finally { if(active) setLoadingAlbum(false); }
    })();
    return ()=>{ active = false; };
  },[openAlbum]);

  const safeRpc = async <T=unknown>(fn: string, params: Record<string, unknown>) => {
    const client = supabase as unknown as { rpc: (f:string, p:Record<string,unknown>)=>Promise<{ data:T|null; error:{ message:string }|null }> };
    const { error } = await client.rpc(fn, params);
    return error;
  };

  const trackIdSet = useMemo(()=> new Set((trendingTracks||[]).map(t=> t.id).filter(Boolean)), [trendingTracks]);

  const handleLike = useCallback(async (id?:string)=>{
  if(!id) return;
  console.debug('[FeaturedSection] handleLike clicked', id, { userId });
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
      // Tenta baixar a faixa diretamente
      try{
        // procura localmente no modal para evitar fetch extra
        const local = albumDetails?.tracks?.find(t=> String(t.id) === String(id));
        let url = local?.file_url;
        let filename = local?.filename || `track-${id}`;
        if(!url){
          const { data, error } = await supabase.from('tracks').select('id, filename, file_url').eq('id', id).single() as any;
          if(error || !data){ toast({ title:'Não foi possível localizar arquivo da faixa', variant:'destructive' }); return; }
          url = data.file_url; filename = data.filename || filename;
        }
        if(!url){ toast({ title:'URL do arquivo indisponível', variant:'destructive' }); return; }
        enqueueMetric({ type: 'track_download', id, ts: Date.now() });
        toast({ title: 'Iniciando download...' });
        const res = await fetch(url);
        if(!res.ok) { toast({ title:'Falha no download', variant:'destructive' }); return; }
        const blob = await res.blob();
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        // tenta extrair extensão do filename
        a.download = filename.replace(/[^a-zA-Z0-9-_\. ]/g,'_');
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{ URL.revokeObjectURL(objectUrl); a.remove(); }, 2000);
        reload();
        return;
      }catch(e:any){ toast({ title:'Erro ao baixar faixa', description: e?.message||String(e), variant:'destructive' }); return; }
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

  const { play, playQueue } = usePlayer();
  const { registerTrackPlay } = useRegisterPlay();
  const handlePlay = useCallback(async (id?:string)=>{
    if(!id){ toast({ title: 'Sem ID para tocar.' }); return; }
    // Decide se é track ou álbum; se track registra play
    try{
      if(trackIdSet.has(id)) {
        // registra play
        registerTrackPlay(id);
        // tenta encontrar a faixa no albumDetails carregado (evita fetch)
        const local = albumDetails?.tracks?.find(t=> String(t.id) === String(id));
        let trackRow: any = null;
        if(local){ trackRow = local; }
        else {
          const { data, error } = await supabase.from('tracks').select('id, filename, file_url, album_id').eq('id', id).single() as any;
          if(error || !data){ toast({ title: 'Não foi possível carregar a faixa para reprodução.' , variant:'destructive' }); return; }
          trackRow = data;
        }
        const playerTrack = {
          id: String(trackRow.id),
          title: (trackRow.filename || '').replace(/\.[a-zA-Z0-9]+$/, ''),
          url: trackRow.file_url,
          albumId: trackRow.album_id || openAlbum?.id || undefined,
        };
        // play imediato substituindo a fila atual
        play(playerTrack, { replaceQueue: true });
        return;
      }
      // Se não é track, apenas notificar (ou implementar play de álbum separado)
      toast({ title: 'Reprodução iniciada (demo)' });
    }catch(e:any){ toast({ title:'Erro ao iniciar reprodução', description: e.message||String(e), variant:'destructive' }); }
  },[toast, trackIdSet, registerTrackPlay]);

  interface TrackLike { id?: string; albumId?: string; name?: string; title?: string; artist?: string; likes_count?: number; }

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
                    onClick={()=> setOpenAlbum({ id: item.albumId || item.id, title, artist: item.artist || 'Artista' })}
                    liked={isTrackLiked(item.id) || isAlbumLiked(item.id)}
                    onLike={()=> handleLike(item.id)}
                    onDownload={()=> handleDownload(item.id)}
                    onPlay={()=> handlePlay(item.id)}
                    onAddToPlaylist={()=> openAddToPlaylist(item.id)}
                    likeCount={trackLikeCounts?.[String(item.id)] ?? item.likes_count}
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
  <Button onClick={()=> setOpenTrendingAlbums(true)} variant="ghost" className="text-primary hover:bg-primary/5">
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
                onClick={()=> setOpenAlbum({ id: album.id, title: album.title, artist: album.artist })}
                onAddToPlaylist={()=> openAddToPlaylist(album.id)}
              />
            ))}
          </div>
        )}
      </div>

  {/* CTA removido: agora em CtaSection no final da página */}
      {/* Dialog álbum individual */}
      <Dialog open={!!openAlbum} onOpenChange={(o)=> !o && setOpenAlbum(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{openAlbum?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-36 h-36 bg-muted rounded-md overflow-hidden">
                {albumDetails?.cover_url ? (
                  <img src={albumDetails.cover_url} alt={openAlbum?.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-sm">Sem capa</div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Artista: {openAlbum?.artist}</p>
                <p className="text-sm mt-2">{albumDetails?.description || 'Sem descrição.'}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={async ()=>{
                    if(!openAlbum?.id) return; try{
                      const { data: tracks, error } = await supabase.from('tracks').select('id, filename, file_url').eq('album_id', openAlbum.id).order('created_at',{ ascending:true });
                      if(error) throw error;
                      if(!tracks || !tracks.length){ toast({ title:'Álbum sem faixas', variant:'destructive' }); return; }
                      // converte para PlayerTrack
                      const toPlay = (tracks as any[]).map((t:any)=> ({ id: t.id, title: t.filename.replace(/\.[a-zA-Z0-9]+$/,''), url: t.file_url, albumId: openAlbum.id }));
                      // usa playQueue para tocar imediatamente
                      playQueue(toPlay, 0);
                      toast({ title: 'Álbum adicionado à fila e reproduzindo.' });
                    }catch(e:any){ toast({ title:'Erro ao adicionar álbum à fila', description: e.message||String(e), variant:'destructive' }); }
                  }}>Adicionar álbum à fila</Button>
                  <Button size="sm" variant="outline" onClick={async ()=>{ if(!openAlbum?.id) return; try { await downloadAlbumAsZip(openAlbum.id); toast({ title:'Download iniciado' }); } catch(e:any){ toast({ title:'Erro no download', description: e.message||String(e), variant:'destructive' }); } }}>Download álbum</Button>
                </div>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 w-12">#</th>
                    <th className="text-left px-3 py-2">Faixa</th>
                    <th className="text-right px-3 py-2 w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAlbum && <tr><td colSpan={3} className="p-4 text-center">Carregando...</td></tr>}
                  {!loadingAlbum && (albumDetails?.tracks && albumDetails.tracks.length > 0) ? (
                    albumDetails.tracks.map((t, idx) => (
                      <tr key={t.id} className="border-t hover:bg-muted/40">
                        <td className="px-3 py-2 text-xs text-muted-foreground">{idx+1}</td>
                        <td className="px-3 py-2">{t.filename.replace(/\.[a-zA-Z0-9]+$/, '')}</td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={()=> handlePlay(t.id)}><Play className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={()=> openAddToPlaylist(t.id)}><Plus className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={()=> handleLike(t.id)}><Heart className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={()=> handleDownload(t.id)}><Download className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (!loadingAlbum && <tr><td colSpan={3} className="p-4 text-center">Nenhuma faixa encontrada.</td></tr>)}
                </tbody>
              </table>
            </div>
            {/* Debug visual quando nenhuma faixa encontrada */}
            {!loadingAlbum && (!albumDetails || !albumDetails.tracks || albumDetails.tracks.length === 0) && (
              <div className="mt-3 p-3 bg-muted/30 rounded text-xs text-muted-foreground">
                <div><strong>Debug: openAlbum</strong>: {JSON.stringify(openAlbum)}</div>
                <div className="mt-2"><strong>Debug: albumDetails</strong>: {JSON.stringify(albumDetails)}</div>
                {albumDebug && (
                  <details className="mt-2 text-xs text-muted-foreground"><summary>Debug queries</summary><pre className="whitespace-pre-wrap">{JSON.stringify(albumDebug, null, 2)}</pre></details>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog 100 músicas */}
      <Dialog open={openTrendingAll} onOpenChange={setOpenTrendingAll}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Top 100 Músicas em Alta</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {top100Tracks.length === 0 ? (
                <div className="col-span-full text-center text-sm text-muted-foreground py-8">Nenhuma música em alta.</div>
              ) : (
                top100Tracks.map((t, i) => (
                  <MusicCard
                    key={t.id || i}
                    id={t.id}
                    title={t.title}
                    artist={t.artist}
                    colorVariant={t.colorVariant}
                    size="small"
                    onClick={() => setOpenAlbum({ id: t.id, title: t.title, artist: t.artist })}
                    liked={isTrackLiked(t.id) || isAlbumLiked(t.id)}
                    likeCount={trackLikeCounts?.[String(t.id)]}
                    onLike={() => handleLike(t.id)}
                    onDownload={() => handleDownload(t.id)}
                    onPlay={() => handlePlay(t.id)}
                    onAddToPlaylist={()=> openAddToPlaylist(t.id)}
                    disableActions={false}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog 100 álbuns */}
      <Dialog open={openTrendingAlbums} onOpenChange={setOpenTrendingAlbums}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Top 100 Álbuns em Alta</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {top100Albums.length === 0 ? (
                <div className="col-span-full text-center text-sm text-muted-foreground py-8">Nenhum álbum em alta.</div>
              ) : (
                top100Albums.map((a, i) => (
                  <MusicCard
                    key={a.id || i}
                    id={a.id}
                    title={a.title}
                    artist={a.artist}
                    colorVariant={a.colorVariant}
                    image={a.cover}
                    size="small"
                    onClick={() => setOpenAlbum({ id: a.id, title: a.title, artist: a.artist })}
                    disableActions
                    onAddToPlaylist={()=> openAddToPlaylist(a.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
        {/* Dialog adicionar à playlist (reaproveita UI do MusicPlayer) */}
        <Dialog open={showAddPlaylist} onOpenChange={(o)=>{ if(!addingToPlaylist){ setShowAddPlaylist(o); if(!o){ setSelectedPlaylist(''); setTrackToAdd(null); } } }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Adicionar à Playlist</DialogTitle>
            </DialogHeader>
            {!trackToAdd && <p className="text-sm text-muted-foreground">Nenhuma faixa selecionada.</p>}
            {trackToAdd && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground truncate">Faixa selecionada: <span className="font-medium">{trackToAdd}</span></p>
                {loadingPlaylists && <p className="text-xs text-muted-foreground">Carregando playlists...</p>}
                {!loadingPlaylists && playlists.length === 0 && <p className="text-xs text-muted-foreground">Você não tem playlists. Crie uma na página Playlists.</p>}
                {!loadingPlaylists && playlists.length > 0 && (
                  <select value={selectedPlaylist} onChange={e=> setSelectedPlaylist(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Selecionar playlist...</option>
                    {playlists.map(p=> <option key={p.id} value={p.id}>{p.name} ({p.tracks_count||0})</option>)}
                  </select>
                )}
              </div>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={()=> setShowAddPlaylist(false)}>Cancelar</Button>
              <Button size="sm" disabled={!trackToAdd || !selectedPlaylist || addingToPlaylist} onClick={handleAddToPlaylist}>{addingToPlaylist ? 'Adicionando...' : 'Adicionar'}</Button>
            </div>
          </DialogContent>
        </Dialog>

    </div>
  );
};

export default FeaturedSection;