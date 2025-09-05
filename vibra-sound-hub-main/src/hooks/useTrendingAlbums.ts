import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingAlbum {
  id: string; name: string; genre: string | null; cover_url: string | null; user_id: string | null; created_at: string;
  plays_count: number; downloads_count: number; likes_count: number; score: number;
}

interface Options { limit?: number; }

export function useTrendingAlbums(options: Options = {}) {
  const { limit = 12 } = options;
  const [data, setData] = useState<TrendingAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async ()=>{
    setLoading(true); setError(null);
    // 1) tentativa: view agregada
    const { data: rows, error: viewError } = await supabase
      .from('album_trending_view')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    if(!viewError && rows && rows.length){
      setData(rows as TrendingAlbum[]); setLoading(false); return;
    }
    // 2) fallback simples: pegar últimos álbuns criados
    const { data: albums, error: albumsErr } = await supabase
      .from('albums')
      .select('id, name, genre, cover_url, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if(albumsErr){ setError(viewError?.message || albumsErr.message); setLoading(false); return; }
  const coerced: TrendingAlbum[] = ((albums as any) || []).map((a:any, i:number)=>({
      id: a.id,
      name: a.name,
      genre: a.genre,
      cover_url: a.cover_url,
      user_id: a.user_id,
      created_at: a.created_at,
      plays_count: 0,
      downloads_count: 0,
      likes_count: 0,
      score: 0 - i
  }));
    setData(coerced);
    setLoading(false);
  },[limit]);

  useEffect(()=>{ load(); }, [load]);

  return { data, loading, error, reload: load };
}