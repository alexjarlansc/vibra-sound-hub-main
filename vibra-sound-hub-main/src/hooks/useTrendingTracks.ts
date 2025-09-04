import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingTrackRow {
  id: string; name: string; album_id: string | null; user_id: string | null; created_at: string;
  plays_count: number; downloads_count: number; likes_count: number; score: number;
}

interface Options { limit?: number; }

/*
  Hook temporário: tenta ler da view 'track_trending_view'.
  Caso a view não exista, faz fallback calculando score localmente a partir de tabelas bases (se existirem).
*/
export function useTrendingTracks(options: Options = {}) {
  const { limit = 12 } = options;
  const [data, setData] = useState<TrendingTrackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async ()=>{
    setLoading(true); setError(null);
    // 1. tentativa: view agregada
    const { data: rows, error: viewError } = await supabase
      .from('track_trending_view')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    if(!viewError && rows){
      setData(rows as TrendingTrackRow[]);
      setLoading(false); return;
    }

    // 2. fallback: tentar montar score rudimentar a partir de "tracks" se existir
    interface TrackRow { id: string; created_at: string; filename: string; }
    type GenericError = { message: string } | null;
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('id, created_at, filename')
      .limit(limit * 5) as unknown as { data: TrackRow[] | null; error: GenericError };
    if(tracksError){ setError(viewError?.message || tracksError.message); setLoading(false); return; }

    // sem tabelas de plays/likes/downloads definidas ainda, score = 0
    const built: TrendingTrackRow[] = (tracks||[]).map((t:TrackRow,i)=>({
      id: t.id,
      name: t.filename,
      album_id: null,
      user_id: null,
      created_at: t.created_at,
      plays_count: 0,
      downloads_count: 0,
      likes_count: 0,
      score: 0 - i // mantém ordem estável
    })).slice(0,limit);

    setData(built);
    setLoading(false);
  },[limit]);

  useEffect(()=>{ load(); }, [load]);
  return { data, loading, error, reload: load };
}
