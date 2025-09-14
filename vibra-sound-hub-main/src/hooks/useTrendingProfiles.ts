import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingProfile {
  id: string; username: string; avatar_url: string | null; created_at: string;
  plays_count: number; likes_count: number; downloads_count: number; score: number;
  is_verified?: boolean; role?: string;
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
    // Find users who own at least one album
    let albumOwners: string[] = [];
    try{
      const { data: owners } = await supabase.from('albums').select('user_id').limit(1000) as any;
      albumOwners = ((owners||[]) as any[]).map((o:any)=> o.user_id).filter(Boolean);
    }catch(e){ albumOwners = []; }

    // Try to read from the view first; prefer ordering by plays_count so ranking changes with plays
    try{
      const { data: rows, error } = await supabase
        .from('profile_trending_view')
        .select('*')
        .order('plays_count', { ascending: false })
        .limit(limit);
      if(!error && rows && (rows as any).length){
        // ensure numeric fields and default to 0
        const coerced = (rows as any).map((r:any)=> ({
          id: r.id,
          username: r.username || 'Artista',
          avatar_url: r.avatar_url ?? null,
          created_at: r.created_at || new Date().toISOString(),
          plays_count: Number(r.plays_count) || 0,
          likes_count: Number(r.likes_count) || 0,
          downloads_count: Number(r.downloads_count) || 0,
          score: Number(r.score) || 0,
          is_verified: Boolean(r.is_verified || r.isVerified),
          role: r.role || null
        })) as TrendingProfile[];
        // filter to only profiles that own at least one album
        const filtered = albumOwners.length ? coerced.filter(c=> albumOwners.includes(c.id)) : coerced.filter(c=> false);
        // if fewer than limit, append additional real album owners
        if(filtered.length < limit){
          const missing = limit - filtered.length;
          if(albumOwners.length){
            const remainingIds = albumOwners.filter(id=> !filtered.find(f=> f.id === id)).slice(0, missing);
            if(remainingIds.length){
              const { data: more } = await supabase.from('profiles').select('id, username, avatar_url, created_at').in('id', remainingIds) as any;
              const moreCoerced = ((more||[]) as any[]).map((p:any)=> ({ id: p.id, username: p.username || 'Artista', avatar_url: p.avatar_url ?? null, created_at: p.created_at || new Date().toISOString(), plays_count: 0, likes_count: 0, downloads_count: 0, score: 0, is_verified: Boolean(p.is_verified || p.isVerified), role: p.role || null }));
              setData([...filtered, ...moreCoerced].slice(0, limit));
            } else {
              setData(filtered.slice(0, limit));
            }
          } else {
            // no album owners found -> empty list
            setData([]);
          }
        } else {
          setData(filtered.slice(0, limit));
        }
        setLoading(false);
        return;
      }
    }catch(err){ /* ignore and fallback below */ }

    // If view is not available or returned nothing, fetch profiles that own albums
    try{
      if(albumOwners.length){
        const ids = albumOwners.slice(0, limit);
        const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url, created_at').in('id', ids) as any;
  const coerced = ((profiles||[]) as any[]).map((p:any)=> ({ id: p.id, username: p.username || 'Artista', avatar_url: p.avatar_url ?? null, created_at: p.created_at || new Date().toISOString(), plays_count: 0, likes_count:0, downloads_count:0, score:0, is_verified: Boolean(p.is_verified || p.isVerified), role: p.role || null })) as TrendingProfile[];
        setData(coerced.slice(0, limit));
        setLoading(false);
        return;
      }
    }catch(e){ /* final fallback to fake */ }

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
