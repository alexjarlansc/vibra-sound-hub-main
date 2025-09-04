import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingProfile {
  id: string; username: string; avatar_url: string | null; created_at: string;
  plays_count: number; likes_count: number; downloads_count: number; score: number;
}

interface Options { limit?: number }

/* View sugerida:
CREATE VIEW profile_trending_view AS
SELECT p.id, p.created_at, p.username, p.avatar_url,
       COALESCE(tp.plays_count,0) plays_count,
       COALESCE(al.likes_count,0) likes_count,
       COALESCE(ad.downloads_count,0) downloads_count,
       (COALESCE(tp.plays_count,0)*1 + COALESCE(al.likes_count,0)*3 + COALESCE(ad.downloads_count,0)*2) AS score
FROM profiles p
LEFT JOIN (
  SELECT a.user_id, COUNT(*) plays_count FROM track_plays tp
  JOIN tracks t ON t.id = tp.track_id
  JOIN albums a ON a.id = t.album_id
  GROUP BY a.user_id
) tp ON tp.user_id = p.id
LEFT JOIN (
  SELECT a.user_id, COUNT(*) likes_count FROM album_likes l
  JOIN albums a ON a.id = l.album_id
  GROUP BY a.user_id
) al ON al.user_id = p.id
LEFT JOIN (
  SELECT a.user_id, COUNT(*) downloads_count FROM album_downloads d
  JOIN albums a ON a.id = d.album_id
  GROUP BY a.user_id
) ad ON ad.user_id = p.id;
*/

export function useTrendingProfiles(options: Options = {}) {
  const { limit = 12 } = options;
  const [data, setData] = useState<TrendingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async ()=>{
    setLoading(true); setError(null);
    const { data: rows, error } = await supabase
      .from('profile_trending_view')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    if(!error && rows){ setData(rows as TrendingProfile[]); setLoading(false); return; }

    // fallback fake
    const fake: TrendingProfile[] = Array.from({length:limit}, (_,i)=>({
      id: `fake-${i+1}`,
      username: `Artista ${i+1}`,
      avatar_url: null,
      created_at: new Date().toISOString(),
      plays_count: 0,
      likes_count: 0,
      downloads_count: 0,
      score: 0
    }));
    setData(fake);
    setLoading(false);
  },[limit]);

  useEffect(()=>{ load(); }, [load]);
  return { data, loading, error, reload: load };
}
