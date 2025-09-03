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
    const { data: rows, error } = await supabase
      .from('album_trending_view')
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