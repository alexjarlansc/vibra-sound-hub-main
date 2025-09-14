import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Heart, Download, Plus } from "lucide-react";
import { usePlayer } from '@/context/PlayerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const FeaturedSection = () => {
  const [openAlbum, setOpenAlbum] = useState<{ id?:string; title:string; artist:string }|null>(null);
  const { data: trendingData } = useTrendingAlbums({ limit: 12 });
  const { data: trendingTracks } = useTrendingTracks({ limit: 12 });
  const { isLiked: isAlbumLiked, toggleLike: toggleAlbumLike } = useFavoriteAlbums();
  const { isLiked: isTrackLiked, toggleTrackLike, counts: trackLikeCounts } = useTrackFavorites();
  const { userId } = useAuth();
  const { toast } = useToast();

  const [albumDetails, setAlbumDetails] = useState<null | { cover_url?: string | null; description?: string | null; tracks?: Array<{ id: string; filename: string; duration?: string | null; file_url?: string | null }> }>(null);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [albumDebug, setAlbumDebug] = useState<any>(null);

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
      try{
        const { data: alb } = await supabase.from('albums').select('id, name, cover_url, description, user_id').eq('id', String(openAlbum.id)).single() as any;
        let { data: tracks } = await supabase.from('tracks').select('id, filename, file_url, album_id, duration').eq('album_id', String(openAlbum.id)).order('created_at', { ascending: true }) as any;
        if((!tracks || tracks.length === 0)){
          const { data: singleTrack } = await supabase.from('tracks').select('id, filename, file_url, album_id, duration').eq('id', String(openAlbum.id)).single() as any;
          if(singleTrack && singleTrack.album_id){
            const albumId = String(singleTrack.album_id);
            const { data: alb2 } = await supabase.from('albums').select('id, name, cover_url, description').eq('id', albumId).single() as any;
            if(alb2){
              const { data: tracks2 } = await supabase.from('tracks').select('id, filename, file_url, duration').eq('album_id', albumId).order('created_at', { ascending: true }) as any;
              setAlbumDetails({ cover_url: alb2.cover_url || null, description: alb2.description || null, tracks: tracks2 || [] });
              return;
            }
          }
        }
        const a = alb || null;
        // tentar buscar o nome do usuário/dono do álbum e atualizar openAlbum para exibir o artista
        try{
          const ownerId = (a && (a.user_id || a.user)) ? (a.user_id || a.user) : null;
          if(ownerId){
            const { data: owner } = await supabase.from('profiles').select('username').eq('id', String(ownerId)).single() as any;
            if(owner && owner.username){
              // preenche o campo artist no estado openAlbum (se ainda estiver aberto)
              setOpenAlbum(prev => prev ? { ...prev, artist: owner.username } : prev);
            }
          }
        }catch(e){ /* ignore owner fetch errors silently */ }
        const finalTracks = tracks || [];
        setAlbumDetails({ cover_url: a?.cover_url || null, description: a?.description || null, tracks: finalTracks || [] });
      }catch(e){ if(active) setAlbumDetails(null); } finally { if(active) setLoadingAlbum(false); }
    })();
    return ()=>{ active = false; };
  },[openAlbum]);

  const trackIdSet = useMemo(()=> new Set((trendingTracks||[]).map((t:any)=> String(t.id)).filter(Boolean)), [trendingTracks]);

  const handleLike = useCallback(async (id?:string)=>{
    if(!id) return;
    if(!userId){ toast({ title: 'Faça login para curtir.' }); return; }
    if(trackIdSet.has(String(id))) {
      toggleTrackLike(id);
    } else {
      toggleAlbumLike(id);
    }
  },[userId, toast, trackIdSet, toggleTrackLike, toggleAlbumLike]);

  const handleDownload = useCallback(async (id?:string)=>{
    if(!id) return;
    if(trackIdSet.has(String(id))){
      try{
        const local = albumDetails?.tracks?.find(t=> String(t.id) === String(id));
        let url = local?.file_url;
        let filename = (local?.filename as string) || `track-${id}`;
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
        a.download = filename.replace(/[^a-zA-Z0-9-_. ]/g,'_');
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{ URL.revokeObjectURL(objectUrl); a.remove(); }, 2000);
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
  },[toast, trackIdSet, albumDetails]);

  const { play, playQueue } = usePlayer();
  const { registerTrackPlay } = useRegisterPlay();
  const handlePlay = useCallback(async (id?:string)=>{
    if(!id){ toast({ title: 'Sem ID para tocar.' }); return; }
    try{
      if(trackIdSet.has(String(id))) {
        registerTrackPlay(id);
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
        play(playerTrack, { replaceQueue: true });
        return;
      }
      toast({ title: 'Reprodução iniciada (demo)' });
    }catch(e:any){ toast({ title:'Erro ao iniciar reprodução', description: e.message||String(e), variant:'destructive' }); }
  },[toast, trackIdSet, registerTrackPlay, albumDetails, play, openAlbum]);

  return (
    <div className="space-y-16">
      {/* 'Músicas em Alta' and 'Álbuns em Alta' removed as requested */}

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
                      const toPlay = (tracks as any[]).map((t:any)=> ({ id: t.id, title: t.filename.replace(/\.[a-zA-Z0-9]+$/,''), url: t.file_url, albumId: openAlbum.id }));
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
                  {loadingAlbum ? (
                    <tr><td colSpan={3} className="p-4 text-center">Carregando...</td></tr>
                  ) : albumDetails?.tracks && albumDetails.tracks.length > 0 ? (
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
                  ) : (
                    <tr><td colSpan={3} className="p-4 text-center">Nenhuma faixa encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
                  {playlists.map((p: any)=> <option key={p.id} value={p.id}>{p.name} ({p.tracks_count||0})</option>)}
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