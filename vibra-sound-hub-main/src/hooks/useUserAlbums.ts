import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserAlbum { id: string; name: string; cover_url: string | null; genre: string | null; created_at: string; }

interface Options { pageSize?: number; search?: string; enabled?: boolean; }

export function useUserAlbums(opts: Options){
  const { pageSize = 12, search = '', enabled = true } = opts;
  const { userId } = useAuth();
  const [albums, setAlbums] = useState<UserAlbum[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const loadingRef = useRef(false);

  const reset = useCallback(()=>{
    setAlbums([]); setPage(0); setHasMore(true); setInitialLoading(true);
  },[]);

  const load = useCallback(async ()=>{
    if(!enabled || !userId) return;
    if(loadingRef.current) return;
    if(!hasMore) return;
    loadingRef.current = true;
    if(page===0) setInitialLoading(true);
    setLoading(true);
    let query = supabase.from('albums').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page*pageSize, page*pageSize + pageSize -1);
    if(search.trim()) query = query.ilike('name', `%${search.trim()}%`);
    const { data, error } = await query;
    if(!error){
      const rows = (data as UserAlbum[]) || [];
      setAlbums(prev => [...prev, ...rows]);
      if(rows.length < pageSize) setHasMore(false);
      setPage(p => p+1);
    }
    setLoading(false); setInitialLoading(false); loadingRef.current = false;
  },[enabled, userId, hasMore, page, pageSize, search]);

  // reload when search changes or user changes
  useEffect(()=>{ reset(); }, [search, userId, reset]);
  useEffect(()=>{ if(enabled && userId){ load(); } }, [enabled, userId, load]);

  return { albums, loadMore: load, hasMore, loading, initialLoading, reset };
}
