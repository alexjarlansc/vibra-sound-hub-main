import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FavoriteAlbumLike { id: string; created_at: string; album_id: string; user_id: string; }
export interface FavoriteAlbumMerged extends FavoriteAlbumLike { album?: { id:string; name:string; cover_url:string|null; genre:string|null; user_id: string | null } }

// Tipagem auxiliar para corrigir inferência do Supabase na consulta de álbuns
interface Album { id:string; name:string; cover_url:string|null; genre:string|null; user_id:string|null }

// Hook robusto para favoritos de álbuns
export const useFavoriteAlbums = () => {
  const { userId } = useAuth();
  const [likes, setLikes] = useState<FavoriteAlbumLike[]>([]);
  const [albumsMap, setAlbumsMap] = useState<Record<string, FavoriteAlbumMerged['album']>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Carrega likes + detalhes
  const load = useCallback(async ()=>{
    if(!userId){ setLikes([]); setAlbumsMap({}); return; }
    if(loadingRef.current) return; // evita corrida
    loadingRef.current = true;
    setLoading(true); setError(null);
    try {
      const { data: likesData, error: likesErr } = await supabase
        .from('album_likes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at',{ ascending:false });
      if(likesErr) throw likesErr;
      const likeList = (likesData || []) as FavoriteAlbumLike[];
      if(!mountedRef.current) return;
      setLikes(likeList);
      const ids = Array.from(new Set(likeList.map(l=> l.album_id))).filter(Boolean);
      if(ids.length){
        const { data: albumsRaw, error: albumErr } = await supabase
          .from('albums')
          .select('id,name,cover_url,genre,user_id')
          .in('id', ids);
        if(albumErr) throw albumErr;
        if(!mountedRef.current) return;
        const albums = (albumsRaw || []) as Album[];
        // enriquecer com username do dono do álbum (artist) quando possível
        const ownerIds = Array.from(new Set(albums.map(a=> a.user_id).filter(Boolean)));
        let ownersMap: Record<string,string> = {};
        try{
          if(ownerIds.length){
            const { data: owners } = await supabase.from('profiles').select('id,username').in('id', ownerIds) as any;
            (owners||[]).forEach((o:any)=> { ownersMap[o.id] = o.username; });
          }
        }catch(e){ /* ignore */ }
        const map: Record<string, FavoriteAlbumMerged['album']> = {};
        albums.forEach(a => { map[a.id] = { ...a, // @ts-ignore adding artist
          artist: ownersMap[String(a.user_id)] || '' } as any; });
        setAlbumsMap(map);
      } else {
        setAlbumsMap({});
      }
    } catch(e:any){
      if(mountedRef.current) setError(e.message || 'Erro ao carregar favoritos');
    } finally {
      if(mountedRef.current){ setLoading(false); }
      loadingRef.current = false;
    }
  },[userId]);

  useEffect(()=>{ mountedRef.current = true; return ()=>{ mountedRef.current = false; }; },[]);
  useEffect(()=>{ load(); },[load]);

  // Derivado
  const data: FavoriteAlbumMerged[] = useMemo(
    () => likes.map(l=> ({ ...l, album: albumsMap[l.album_id] })),
    [likes, albumsMap]
  );

  const isLiked = useCallback((albumId?:string) => !!albumId && likes.some(l=> l.album_id === albumId), [likes]);

  // Toggle otimista
  const toggleLike = useCallback(async (albumId: string)=>{
    if(!userId){ setError('Necessário login.'); return; }
    // Estado anterior para rollback
    const prev = likes;
    const existing = prev.find(l=> l.album_id === albumId);
    const optimistic: FavoriteAlbumLike[] = existing
      ? prev.filter(l=> l.album_id !== albumId)
      : [{ id: `optimistic-${albumId}`, created_at: new Date().toISOString(), album_id: albumId, user_id: userId }, ...prev];
    setLikes(optimistic);
    try {
      // Tenta função RPC se existir
      const rpcClient = supabase as unknown as { rpc: (fn:string, params:Record<string,unknown>)=>Promise<{ data:any; error:any }> };
      const { error: rpcErr } = await rpcClient.rpc('toggle_album_like', { p_album: albumId });
      if(rpcErr){
        // Fallback manual
        const albumLikes = supabase.from('album_likes') as any;
        if(existing){
          await albumLikes.delete().eq('id', existing.id);
        } else {
          const insertRes = await albumLikes.insert({ album_id: albumId, user_id: userId });
          if(insertRes.error) throw insertRes.error;
        }
      }
      // Re-sync para pegar IDs reais
      await load();
    } catch(e:any){
      // rollback
      setLikes(prev);
      setError(e.message || 'Erro ao alternar favorito');
    }
  },[likes, userId, load]);

  // Opcional: assinatura tempo real (quando realtime habilitado)
  useEffect(()=>{
    if(!userId) return;
    const channel = (supabase as any).channel?.('album_likes_changes');
    if(!channel) return;
    channel.on('postgres_changes',{ event:'*', schema:'public', table:'album_likes', filter:`user_id=eq.${userId}` },()=>{
      load();
    }).subscribe();
    return ()=> { channel.unsubscribe?.(); };
  },[userId, load]);

  return { data, loading, error, reload: load, toggleLike, isLiked };
};
