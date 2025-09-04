import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect, useState } from 'react';

export interface Playlist { id:string; name:string; description:string|null; cover_url:string|null; created_at:string; }
export interface PlaylistTrack { id:string; playlist_id:string; track_id:string; position:number|null; created_at:string; }

export function usePlaylists(){
  const { userId } = useAuth();
  const [data, setData] = useState<(Playlist & { tracks_count?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const load = useCallback(async ()=>{
    if(!userId){ setData([]); return; }
    setLoading(true); setError(null);
    try {
  const { data: rows, error: err } = await supabase.from('playlists').select('*').order('created_at',{ ascending:false });
  if(err) throw err;
  const playlistList = (rows||[]) as Playlist[];
  // carregar contagem de faixas (simples; pode trocar por view futura)
  const { data: trackRows, error: trackErr } = await supabase.from('playlist_tracks').select('playlist_id');
  if(trackErr) throw trackErr;
  const counts: Record<string, number> = {};
  (trackRows||[]).forEach((r: any)=>{ counts[r.playlist_id] = (counts[r.playlist_id]||0)+1; });
  setData(playlistList.map(p=> ({ ...p, tracks_count: counts[p.id]||0 })));
    } catch(e:any){ setError(e.message || 'Erro ao carregar playlists'); }
    finally { setLoading(false); }
  },[userId]);

  useEffect(()=>{ load(); },[load]);

  const create = useCallback(async (payload: { name:string; description?:string; cover_url?:string|null; })=>{
    if(!userId) throw new Error('Precisa login');
    const { error } = await (supabase.from('playlists') as any).insert({ name: payload.name, description: payload.description||null, cover_url: payload.cover_url||null, user_id: userId });
    if(error) throw error;
    await load();
  },[userId, load]);

  const remove = useCallback(async (id:string)=>{
    await (supabase.from('playlists') as any).delete().eq('id', id);
    await load();
  },[load]);

  const update = useCallback(async (id:string, payload: { name?:string; description?:string|null; cover_url?:string|null })=>{
    const body: any = {};
    if(payload.name !== undefined) body.name = payload.name;
    if(payload.description !== undefined) body.description = payload.description;
    if(payload.cover_url !== undefined) body.cover_url = payload.cover_url;
    if(Object.keys(body).length){ await (supabase.from('playlists') as any).update(body).eq('id', id); }
    await load();
  },[load]);

  return { data, loading, error, reload: load, create, remove, update };
}

export function usePlaylistTracks(playlistId?:string){
  const [data, setData] = useState<PlaylistTrack[]>([]);
  const [tracksMap, setTracksMap] = useState<Record<string, { id:string; filename:string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const load = useCallback(async ()=>{
    if(!playlistId){ setData([]); return; }
    setLoading(true); setError(null);
    try {
      const { data: rows, error: err } = await supabase.from('playlist_tracks').select('*').eq('playlist_id', playlistId).order('position',{ ascending:true });
      if(err) throw err;
      const list = (rows||[]) as PlaylistTrack[];
      setData(list);
      // fetch track details
      const trackIds = Array.from(new Set(list.map(r=> r.track_id)));
      if(trackIds.length){
        const { data: trackRows, error: trackErr } = await supabase.from('tracks').select('id, filename').in('id', trackIds);
        if(!trackErr){
          const map: Record<string, { id:string; filename:string }> = {};
          (trackRows||[]).forEach((t:any)=>{ map[t.id] = { id: t.id, filename: t.filename }; });
          setTracksMap(map);
        }
      } else {
        setTracksMap({});
      }
    } catch(e:any){ setError(e.message || 'Erro ao carregar faixas'); }
    finally { setLoading(false); }
  },[playlistId]);

  useEffect(()=>{ load(); },[load]);

  const addTrack = useCallback(async (trackId:string)=>{
    if(!playlistId) return;
    // define posição como último+1
    const maxPos = data.reduce((m,c)=> c.position!=null && c.position>m ? c.position : m, 0);
    await (supabase.from('playlist_tracks') as any).insert({ playlist_id: playlistId, track_id: trackId, position: maxPos + 1 });
    await load();
  },[playlistId, load, data]);

  const removeTrack = useCallback(async (trackId:string)=>{
    if(!playlistId) return;
    await (supabase.from('playlist_tracks') as any).delete().eq('playlist_id', playlistId).eq('track_id', trackId);
    await load();
  },[playlistId, load]);

  const moveTrack = useCallback(async (trackId:string, direction: 'up'|'down')=>{
    const list = [...data].sort((a,b)=>(a.position||0)-(b.position||0));
    const index = list.findIndex(t=> t.track_id === trackId);
    if(index === -1) return;
    const swapIndex = direction==='up' ? index-1 : index+1;
    if(swapIndex < 0 || swapIndex >= list.length) return;
    const a = list[index];
    const b = list[swapIndex];
    const aPos = a.position || 0; const bPos = b.position || 0;
    // swap positions
    await (supabase.from('playlist_tracks') as any).update({ position: 999999 }).eq('id', a.id); // temp to avoid unique issues
    await (supabase.from('playlist_tracks') as any).update({ position: aPos }).eq('id', b.id);
    await (supabase.from('playlist_tracks') as any).update({ position: bPos }).eq('id', a.id);
    await load();
  },[data, load]);

  const withMeta = data.map(d=> ({ ...d, track: tracksMap[d.track_id] }));
  return { data: withMeta, loading, error, addTrack, removeTrack, moveTrack, reload: load };
}
