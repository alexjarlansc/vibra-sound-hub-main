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
      // tentar enriquecer com username do dono do álbum se houver user_id
      try{
        const raw = rows as any[];
        const ownerIds = Array.from(new Set(raw.map(r=> r.user_id).filter(Boolean)));
        if(ownerIds.length){
          const { data: owners } = await supabase.from('profiles').select('id, username').in('id', ownerIds) as any;
          const map = ((owners||[]) as any[]).reduce((acc:any, o:any)=> { acc[o.id] = o.username; return acc; }, {} as Record<string,string>);
          const enriched = raw.map(r=> ({ ...r, artist: map[String(r.user_id)] || '' }));
          setData(enriched as TrendingAlbum[]); setLoading(false); return;
        }
      }catch(e){ /* ignore owner enrichment errors */ }
      setData(rows as TrendingAlbum[]); setLoading(false); return;
    }
    // 2) fallback simples: pegar últimos álbuns criados
    const { data: albums, error: albumsErr } = await supabase
      .from('albums')
      .select('id, name, genre, cover_url, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if(albumsErr){ setError(viewError?.message || albumsErr.message); setLoading(false); return; }
    const rawAlbums = ((albums as any) || []);
    // enriquecer com username dos donos se possível
    let coerced: any[] = rawAlbums.map((a:any, i:number)=>({
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
    try{
      const ownerIds = Array.from(new Set(coerced.map(a=> a.user_id).filter(Boolean)));
      if(ownerIds.length){
        const { data: owners } = await supabase.from('profiles').select('id, username').in('id', ownerIds) as any;
        const map = ((owners||[]) as any[]).reduce((acc:any, o:any)=> { acc[o.id] = o.username; return acc; }, {} as Record<string,string>);
        coerced = coerced.map(a=> ({ ...a, artist: map[String(a.user_id)] || '' }));
      }
    }catch(e){ /* ignore */ }
    setData(coerced as TrendingAlbum[]);
    setLoading(false);
  },[limit]);

  useEffect(()=>{ load(); }, [load]);

  return { data, loading, error, reload: load };
}