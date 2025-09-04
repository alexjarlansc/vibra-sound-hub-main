import { useCallback, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TrackLikeRow { id:string; created_at:string; track_id:string; user_id:string; }
export interface TrackRow { id:string; filename:string; created_at:string; album_id:string|null; }

export const useTrackFavorites = () => {
  const { userId } = useAuth();
  const [likes, setLikes] = useState<TrackLikeRow[]>([]);
  const [tracks, setTracks] = useState<Record<string, TrackRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const load = useCallback(async ()=>{
    if(!userId){ setLikes([]); setTracks({}); return; }
    setLoading(true); setError(null);
    try {
      const { data: likeData, error: likeErr } = await supabase.from('track_likes').select('*').eq('user_id', userId).order('created_at',{ ascending:false });
      if(likeErr) throw likeErr;
      const list = likeData as TrackLikeRow[];
      setLikes(list);
      const ids = Array.from(new Set(list.map(l=> l.track_id)));
      if(ids.length){
        const { data: trackData, error: trackErr } = await supabase.from('tracks').select('id, filename, created_at, album_id').in('id', ids);
        if(trackErr) throw trackErr;
        const map: Record<string, TrackRow> = {};
        (trackData||[]).forEach(t=>{ map[t.id] = t as TrackRow; });
        setTracks(map);
      } else {
        setTracks({});
      }
    } catch(e:any){ setError(e.message || 'Erro ao carregar'); }
    finally { setLoading(false); }
  },[userId]);

  useEffect(()=>{ load(); },[load]);

  const data = useMemo(()=> likes.map(l=> ({ ...l, track: tracks[l.track_id] })), [likes, tracks]);

  const isLiked = useCallback((trackId?:string)=> !!trackId && likes.some(l=> l.track_id === trackId), [likes]);

  const toggleTrackLike = useCallback(async (trackId:string)=>{
    try {
      // Otimismo simples
      const existing = likes.find(l=> l.track_id === trackId);
      if(existing){
        setLikes(prev=> prev.filter(l=> l.id !== existing.id));
        await (supabase.from('track_likes') as any).delete().eq('id', existing.id);
      } else {
        const optimistic = { id:`optimistic-${trackId}`, created_at: new Date().toISOString(), track_id: trackId, user_id: userId! } as TrackLikeRow;
        setLikes(prev=> [optimistic, ...prev]);
        const ins = await (supabase.from('track_likes') as any).insert({ track_id: trackId, user_id: userId! });
        if(ins.error) throw ins.error;
      }
      // Re-sync para garantir IDs reais
      await load();
    } catch(e:any){ setError(e.message || 'Erro ao alternar favorito'); await load(); }
  },[likes, userId, load]);

  return { data, loading, error, reload: load, toggleTrackLike, isLiked };
};
