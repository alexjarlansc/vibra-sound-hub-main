import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFollow(profileId: string, currentUserId: string | null) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(false);

  // Carrega status e contadores
  useEffect(() => {
    if (!profileId) return;
    let canceled = false;
    (async () => {
      setLoading(true);
      // Conta seguidores
      const { count: followersCount } = await supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', profileId);
      // Conta seguindo
      const { count: followingCount } = await supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', profileId);
      // Verifica se já segue
      let followingStatus = false;
      if (currentUserId && currentUserId !== profileId) {
        const { count } = await supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', currentUserId).eq('following_id', profileId);
        followingStatus = !!count;
      }
      if (!canceled) {
        setFollowers(followersCount || 0);
        setFollowing(followingCount || 0);
        setIsFollowing(followingStatus);
        setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, [profileId, currentUserId]);

  // Seguir
  const follow = useCallback(async () => {
    if (!currentUserId || currentUserId === profileId) return;
    setLoading(true);
  await supabase.from('followers').insert({ follower_id: currentUserId, following_id: profileId } as any);
    setIsFollowing(true);
    setFollowers(f => f + 1);
    setLoading(false);
  }, [currentUserId, profileId]);

  // Deixar de seguir
  const unfollow = useCallback(async () => {
    if (!currentUserId || currentUserId === profileId) return;
    setLoading(true);
  await supabase.from('followers').delete().eq('follower_id', currentUserId).eq('following_id', profileId);
    setIsFollowing(false);
    setFollowers(f => Math.max(0, f - 1));
    setLoading(false);
  }, [currentUserId, profileId]);

  return { isFollowing, followers, following, loading, follow, unfollow };
}
