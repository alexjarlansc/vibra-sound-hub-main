import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TrackLikeRow { id:string; created_at:string; track_id:string; user_id:string; }
export interface TrackRow { id:string; filename:string; created_at:string; album_id:string|null; }

interface ToggleResult { success: boolean; error?: string }

export const useTrackFavorites = () => {
  const { userId } = useAuth();
  const [likes, setLikes] = useState<TrackLikeRow[]>([]);
  const [tracks, setTracks] = useState<Record<string, TrackRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(()=>{ mountedRef.current = true; return ()=> { mountedRef.current = false; }; },[]);

  const load = useCallback(async ()=>{
    if(!userId){ if(mountedRef.current){ setLikes([]); setTracks({}); } return; }
    if(loadingRef.current) return; // evita reentrância
    loadingRef.current = true;
    if(mountedRef.current){ setLoading(true); setError(null); }
    try {
      const { data: likeData, error: likeErr } = await supabase
        .from('track_likes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at',{ ascending:false });
      if(likeErr) throw likeErr;
      const list = (likeData || []) as TrackLikeRow[];
      if(!mountedRef.current) return;
      setLikes(list);
      const ids = Array.from(new Set(list.map(l=> l.track_id)));
      if(ids.length){
        const { data: trackData, error: trackErr } = await supabase
          .from('tracks')
          .select('id, filename, created_at, album_id')
          .in('id', ids);
        if(trackErr) throw trackErr;
        if(!mountedRef.current) return;
        const map: Record<string, TrackRow> = {};
        (trackData||[]).forEach(t=>{ const row = t as TrackRow; map[row.id] = row; });
        setTracks(map);
      } else {
        setTracks({});
      }
    } catch(e:any){ if(mountedRef.current) setError(e.message || 'Erro ao carregar favoritos'); }
    finally {
      loadingRef.current = false;
      if(mountedRef.current) setLoading(false);
    }
  },[userId]);

  useEffect(()=>{ load(); },[load]);

  // Derived enriched data
  const data = useMemo(()=> likes.map(l=> ({ ...l, track: tracks[l.track_id] })), [likes, tracks]);
  const counts = useMemo(()=>{
    const map: Record<string, number> = {};
    likes.forEach(l=> { map[l.track_id] = (map[l.track_id]||0)+1; });
    return map;
  },[likes]);
  const likeSet = useMemo(()=> new Set(likes.map(l=> l.track_id)), [likes]);
  const isLiked = useCallback((trackId?:string)=> !!trackId && likeSet.has(trackId), [likeSet]);

  const toggleTrackLike = useCallback(async (trackId:string): Promise<ToggleResult> => {
    if(!trackId) return { success:false, error:'trackId vazio' };
  console.debug('[useTrackFavorites] toggleTrackLike called', trackId);
    if(!userId){ setError('Necessário login.'); return { success:false, error:'login' }; }
    // Snapshot para rollback
    const prev = likes;
    const existing = prev.find(l=> l.track_id === trackId);
    // Otimismo
    const optimistic: TrackLikeRow[] = existing
      ? prev.filter(l=> l.id !== existing.id)
      : [{ id:`optimistic-${trackId}`, created_at:new Date().toISOString(), track_id: trackId, user_id: userId }, ...prev];
    setLikes(optimistic);
    try {
      const tbl = supabase.from('track_likes') as any;
      if(existing && !existing.id.startsWith('optimistic-')){
        const del = await tbl.delete().eq('id', existing.id).eq('user_id', userId).eq('track_id', trackId);
        if(del.error) throw del.error;
      } else if(!existing) {
        const ins = await tbl.insert({ track_id: trackId, user_id: userId });
        if(ins.error) throw ins.error;
      }
      // Re-sync
      await load();
      return { success:true };
    } catch(e:any){
      // Rollback
      setLikes(prev);
      const msg = e?.message || 'Erro ao alternar favorito';
      setError(msg);
      return { success:false, error: msg };
    }
  },[likes, userId, load]);

  return { data, loading, error, reload: load, toggleTrackLike, isLiked, counts };
};
