import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/*
  Hook de músicas em alta.
  Assumimos a existência futura de uma view SQL: track_trending_view
  Estrutura sugerida (criar no banco):
    CREATE VIEW track_trending_view AS
    SELECT t.id,
           t.created_at,
           t.filename as name,
           t.album_id,
           t.user_id,
           COALESCE(p.plays_count,0) AS plays_count,
           COALESCE(d.downloads_count,0) AS downloads_count,
           COALESCE(l.likes_count,0) AS likes_count,
           (COALESCE(p.plays_count,0) * 1 + COALESCE(l.likes_count,0) * 3 + COALESCE(d.downloads_count,0) * 2) AS score
    FROM tracks t
    LEFT JOIN (
      SELECT track_id, COUNT(*) plays_count FROM track_plays GROUP BY track_id
    ) p ON p.track_id = t.id
    LEFT JOIN (
      -- se futuramente existir track_downloads
      SELECT album_id as track_id, COUNT(*) downloads_count FROM album_downloads GROUP BY album_id
    ) d ON d.track_id = t.id
    LEFT JOIN (
      -- se futuramente existir track_likes
      SELECT album_id as track_id, COUNT(*) likes_count FROM album_likes GROUP BY album_id
    ) l ON l.track_id = t.id;
*/

export interface TrendingTrack {
  id: string; name: string; album_id: string | null; user_id: string | null; created_at: string;
  plays_count: number; downloads_count: number; likes_count: number; score: number;
}
interface Options { limit?: number; }

export function useTrendingMusics(options: Options = {}) {
  const { limit = 12 } = options;
  const [data, setData] = useState<TrendingTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async ()=>{
    setLoading(true); setError(null);
    const { data: rows, error } = await supabase
      .from('track_trending_view')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    if(error){ setError(error.message); setLoading(false); return; }
    setData(rows || []);
    setLoading(false);
  },[limit]);

  useEffect(()=>{ load(); }, [load]);

  return { data, loading, error, reload: load };
}
