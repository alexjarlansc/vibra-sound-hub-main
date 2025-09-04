import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Track { id: string; album_id: string | null; filename: string; file_url: string; created_at: string; }

export function useAlbumTracks(albumId?: string){
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async ()=>{
    if(!albumId) return;
    setLoading(true);
    const { data, error } = await supabase.from('tracks').select('*').eq('album_id', albumId).order('created_at', { ascending:false });
    if(!error){ setTracks((data as Track[]) || []); }
    setLoading(false);
  },[albumId]);

  useEffect(()=>{ load(); }, [load]);

  return { tracks, loading, reload: load };
}
