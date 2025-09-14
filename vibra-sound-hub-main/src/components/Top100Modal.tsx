import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Download, Plus, Heart } from 'lucide-react';
import { useTrendingTracks } from '@/hooks/useTrendingTracks';
import { usePlayer } from '@/context/PlayerContext';
import { useTrackFavorites } from '@/hooks/useTrackFavorites';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useToast } from '@/hooks/use-toast';
import { useRegisterPlay } from '@/hooks/useRegisterPlay';

export default function Top100Modal({ open, onOpenChange }: { open: boolean; onOpenChange: (o:boolean)=>void }){
  const { data: tracks = [], loading } = useTrendingTracks({ limit: 100 });
  const player = usePlayer();
  const { isLiked, toggleTrackLike } = useTrackFavorites();
  const { data: playlists = [] } = usePlaylists();
  const { toast } = useToast();
  const { registerTrackPlay } = useRegisterPlay();
  const [addingToPlaylistTrack, setAddingToPlaylistTrack] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');

  const handlePlay = async (id: string) => {
    try {
      // resolve url via supabase client (same helper pattern used elsewhere)
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('tracks').select('id, filename, file_url, album_id').eq('id', id).single() as any;
      if(!data || !data.file_url){ toast({ title: 'URL da faixa não encontrada', variant: 'destructive' }); return; }
      const title = data.filename?.replace(/\.[a-zA-Z0-9]+$/,'') || data.id;
      player.play({ id: data.id, title, url: data.file_url, albumId: data.album_id || undefined }, { replaceQueue: false });
      try{ registerTrackPlay(data.id); }catch{}
    } catch (e:any){ console.error(e); toast({ title: 'Erro ao tocar', description: e?.message }); }
  };

  const resolveSingleTrack = async (id: string) => {
    try{
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('tracks').select('id, filename, file_url, album_id').eq('id', id).single() as any;
      return data;
    }catch(e){ console.error('[Top100Modal] erro ao resolver faixa', e); return null; }
  };

  const handleDownload = async (url?: string, filename?: string) => {
    // resolve file_url if not provided
    let resolvedUrl = url;
    let resolvedFilename = filename;
    if(!resolvedUrl){
      const data = await resolveSingleTrack((filename && !url) ? filename : (filename || ''));
      // resolveSingleTrack expects id, so if filename was passed, skip
      if(data){ resolvedUrl = data.file_url; resolvedFilename = data.filename; }
    }
    if(!resolvedUrl){ toast({ title: 'URL não disponível', variant: 'destructive' }); return; }
    try{
      const res = await fetch(resolvedUrl);
      if(!res.ok) throw new Error('HTTP '+res.status);
      const blob = await res.blob();
      const a = document.createElement('a');
      const href = URL.createObjectURL(blob);
      a.href = href;
      a.download = (resolvedFilename || 'track') + (resolvedFilename?.includes('.') ? '' : '.mp3');
      document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(href); a.remove(); }, 3000);
    }catch(e:any){ console.error(e); toast({ title:'Erro ao baixar', description: e.message, variant:'destructive' }); }
  };

  const handleAddToQueue = async (id: string) => {
    try{
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('tracks').select('id, filename, file_url, album_id').eq('id', id).single() as any;
      if(!data || !data.file_url){ toast({ title: 'URL não encontrada', variant: 'destructive' }); return; }
      const title = data.filename?.replace(/\.[a-zA-Z0-9]+$/,'') || data.id;
      player.addToQueue({ id: data.id, title, url: data.file_url, albumId: data.album_id || undefined } as any);
      toast({ title: 'Adicionado à fila' });
    }catch(e:any){ console.error(e); toast({ title: 'Erro', description: e.message }); }
  };

  const handleStartAddToPlaylist = (trackId: string) => { setAddingToPlaylistTrack(trackId); setSelectedPlaylist(''); };
  const handleConfirmAddToPlaylist = async () => {
    if(!addingToPlaylistTrack || !selectedPlaylist) return;
    try{
      const { supabase } = await import('@/integrations/supabase/client');
      await (supabase.from('playlist_tracks') as any).insert({ playlist_id: selectedPlaylist, track_id: addingToPlaylistTrack });
      toast({ title: 'Adicionado à playlist' });
      setAddingToPlaylistTrack(null); setSelectedPlaylist('');
    }catch(e:any){ console.error(e); toast({ title:'Erro', description: e.message }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Top 100 Músicas</h3>
          <div className="text-sm text-muted-foreground">{tracks.length} faixas</div>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
          {tracks.map((t:any, idx:number)=> (
            <div key={t.id || idx} className="flex items-center justify-between gap-3 p-2 rounded hover:bg-muted/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 text-right text-sm text-muted-foreground">{idx+1}</div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.name || t.filename}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.user_id || t.artist || ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={()=> handlePlay(t.id)} className="bg-primary text-primary-foreground"><Play className="h-4 w-4"/></Button>
                <Button size="sm" variant="ghost" onClick={async ()=>{
                  const data = await resolveSingleTrack(t.id);
                  if(!data || !data.file_url){ toast({ title:'URL não disponível', variant:'destructive' }); return; }
                  await handleDownload(data.file_url, data.filename);
                }}><Download className="h-4 w-4"/></Button>
                <Button size="sm" variant="ghost" onClick={()=> handleAddToQueue(t.id)}><Plus className="h-4 w-4"/></Button>
                <Button size="sm" variant="outline" onClick={()=> handleStartAddToPlaylist(t.id)}>Playlist</Button>
                <Button size="sm" variant="ghost" onClick={async ()=>{
                  try{
                    const res = await toggleTrackLike(t.id);
                    if(!res || !res.success){
                      // missing_table is a sentinel returned by the hook when the DB table is absent
                      if(res?.error === 'login'){
                        toast({ title: 'Faça login para curtir', variant: 'destructive' });
                      } else if(res?.error === 'missing_table'){
                        toast({ title: 'Erro ao curtir', description: 'Tabela `track_likes` não encontrada no banco. Rode a migração em supabase/migrations/202509041700_track_likes.sql', variant: 'destructive' });
                      } else {
                        toast({ title: 'Erro ao curtir', description: res?.error || 'Tente novamente', variant: 'destructive' });
                      }
                    }
                  }catch(e:any){ console.error('[Top100Modal] erro ao curtir', e); toast({ title:'Erro ao curtir', description: e?.message, variant:'destructive' }); }
                }} className={`transition ${isLiked(t.id)? 'text-violet-700' : '' }`}><Heart className="h-4 w-4"/></Button>
              </div>
            </div>
          ))}
        </div>

        {addingToPlaylistTrack && (
          <div className="mt-3 flex items-center gap-2">
            <select value={selectedPlaylist} onChange={e=> setSelectedPlaylist(e.target.value)} className="rounded border px-2 py-1">
              <option value="">Selecionar playlist...</option>
              {playlists.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Button onClick={handleConfirmAddToPlaylist}>Confirmar</Button>
            <Button variant="ghost" onClick={()=> setAddingToPlaylistTrack(null)}>Cancelar</Button>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={()=> onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
